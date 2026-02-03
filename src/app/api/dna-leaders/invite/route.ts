import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, generateToken } from '@/lib/auth';
import { getUnifiedSession, isAdmin as checkIsAdmin, getPrimaryChurch } from '@/lib/unified-auth';
import { sendDNALeaderDirectInviteEmail } from '@/lib/email';

// POST /api/dna-leaders/invite
// Invite a new DNA leader (church admin or super admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getUnifiedSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isSuperAdmin = checkIsAdmin(session);
    const isChurchAdmin = !isSuperAdmin; // Regular church leader

    const body = await request.json();
    const { name, email, church_id, message } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const normalizedEmail = email.toLowerCase().trim();

    // Check if DNA leader already exists
    const { data: existingLeader } = await supabase
      .from('dna_leaders')
      .select('id, email, activated_at')
      .eq('email', normalizedEmail)
      .single();

    if (existingLeader) {
      if (existingLeader.activated_at) {
        return NextResponse.json(
          { error: 'This person is already a DNA leader' },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          { error: 'An invitation has already been sent to this email' },
          { status: 400 }
        );
      }
    }

    // Determine church affiliation
    let finalChurchId: string | null = null;
    let churchName: string | null = null;
    const inviterName = session.name || 'DNA Hub Admin';
    const inviterId = session.userId;

    if (isSuperAdmin) {
      // Super admin can invite to any church or as independent
      if (church_id && church_id !== 'independent') {
        // Verify church exists
        const { data: church, error: churchError } = await supabase
          .from('churches')
          .select('id, name')
          .eq('id', church_id)
          .single();

        if (churchError || !church) {
          return NextResponse.json(
            { error: 'Church not found' },
            { status: 400 }
          );
        }
        finalChurchId = church.id;
        churchName = church.name;
      }
      // If church_id is 'independent' or not provided, finalChurchId stays null
    } else {
      // Church admin can only invite to their own church
      const sessionChurchId = getPrimaryChurch(session);
      if (!sessionChurchId) {
        return NextResponse.json(
          { error: 'Church leader must be associated with a church' },
          { status: 400 }
        );
      }
      finalChurchId = sessionChurchId;

      // Get church name
      const { data: church } = await supabase
        .from('churches')
        .select('name')
        .eq('id', finalChurchId)
        .single();
      churchName = church?.name || null;
    }

    // =====================================================
    // UNIFIED AUTH: Create user and role records upfront
    // This allows the invited person to log in directly with a magic link
    // =====================================================

    // 1. Create or find the user in the unified users table
    let userId: string;
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          email: normalizedEmail,
          name: name.trim(),
        })
        .select('id')
        .single();

      if (userError) {
        console.error('[DNA Leaders] User creation error:', userError);
        return NextResponse.json(
          { error: 'Failed to create user account' },
          { status: 500 }
        );
      }
      userId = newUser.id;
    }

    // 2. Add dna_leader role (if not already present)
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('role', 'dna_leader')
      .eq('church_id', finalChurchId)
      .maybeSingle();

    if (!existingRole) {
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'dna_leader',
          church_id: finalChurchId,
        });

      if (roleError) {
        console.error('[DNA Leaders] Role creation error:', roleError);
        return NextResponse.json(
          { error: 'Failed to assign DNA leader role' },
          { status: 500 }
        );
      }
    }

    // 2b. Add training_participant role (DNA leaders need training access)
    const { data: existingTrainingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('role', 'training_participant')
      .maybeSingle();

    if (!existingTrainingRole) {
      await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'training_participant',
          church_id: null, // Training is not church-specific
        });
    }

    // 3. Create DNA leader record (for group management features)
    const { data: newLeader, error: insertError } = await supabase
      .from('dna_leaders')
      .insert({
        email: normalizedEmail,
        name: name.trim(),
        church_id: finalChurchId,
        invited_by: inviterId,
        invited_by_type: isSuperAdmin ? 'super_admin' : 'church_admin',
        user_id: userId, // Link to unified user
        activated_at: new Date().toISOString(), // Pre-activate since admin invited them
      })
      .select()
      .single();

    if (insertError) {
      console.error('[DNA Leaders] Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create DNA leader record' },
        { status: 500 }
      );
    }

    // 4. Create magic link token for direct login
    const magicToken = generateToken();
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 7); // 7-day expiry

    const { error: tokenError } = await supabase
      .from('magic_link_tokens')
      .insert({
        email: normalizedEmail,
        token: magicToken,
        expires_at: tokenExpiresAt.toISOString(),
        used: false,
      });

    if (tokenError) {
      console.error('[DNA Leaders] Magic token error:', tokenError);
      // Continue anyway - they can request a new magic link via login
    }

    // 5. Send invitation email with direct magic link
    // DNA leaders start with training, then can access groups
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dnadiscipleship.com';
    const magicLink = `${baseUrl}/api/auth/verify?token=${magicToken}&destination=training`;

    const emailResult = await sendDNALeaderDirectInviteEmail(
      normalizedEmail,
      name.trim(),
      magicLink,
      churchName,
      inviterName,
      message
    );

    if (!emailResult.success) {
      console.error('[DNA Leaders] Email send error:', emailResult.error);
      // Don't fail the request - the record is created, they can request a new magic link
    }

    return NextResponse.json({
      success: true,
      leader: {
        id: newLeader.id,
        email: newLeader.email,
        name: newLeader.name,
        church_id: newLeader.church_id,
      },
      emailSent: emailResult.success,
    });

  } catch (error) {
    console.error('[DNA Leaders] Invite error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/dna-leaders/invite
// List pending invitations (for admin view)
export async function GET(request: NextRequest) {
  try {
    const session = await getUnifiedSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isSuperAdmin = checkIsAdmin(session);

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('dna_leaders')
      .select(`
        id,
        email,
        name,
        church_id,
        invited_at,
        activated_at,
        is_active,
        church:churches(id, name)
      `)
      .is('activated_at', null) // Only pending invitations
      .order('invited_at', { ascending: false });

    // Church admins only see their church's invitations
    const sessionChurchId = getPrimaryChurch(session);
    if (!isSuperAdmin && sessionChurchId) {
      query = query.eq('church_id', sessionChurchId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[DNA Leaders] List error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch invitations' },
        { status: 500 }
      );
    }

    return NextResponse.json({ invitations: data });

  } catch (error) {
    console.error('[DNA Leaders] List error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
