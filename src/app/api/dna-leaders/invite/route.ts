import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, generateToken } from '@/lib/auth';
import { getUnifiedSession, isAdmin as checkIsAdmin } from '@/lib/unified-auth';
import { sendDNALeaderInvitationEmail } from '@/lib/email';

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
    let inviterName = session.name;
    let inviterId = session.userId || session.leaderId;

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
      if (!session.churchId) {
        return NextResponse.json(
          { error: 'Church leader must be associated with a church' },
          { status: 400 }
        );
      }
      finalChurchId = session.churchId;

      // Get church name
      const { data: church } = await supabase
        .from('churches')
        .select('name')
        .eq('id', finalChurchId)
        .single();
      churchName = church?.name || null;
    }

    // Generate signup token
    const signupToken = generateToken();
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 7); // 7-day expiry

    // Create DNA leader record
    const { data: newLeader, error: insertError } = await supabase
      .from('dna_leaders')
      .insert({
        email: normalizedEmail,
        name: name.trim(),
        church_id: finalChurchId,
        invited_by: inviterId,
        invited_by_type: isSuperAdmin ? 'super_admin' : 'church_admin',
        signup_token: signupToken,
        signup_token_expires_at: tokenExpiresAt.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('[DNA Leaders] Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      );
    }

    // Send invitation email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dnadiscipleship.com';
    const signupUrl = `${baseUrl}/groups/signup?token=${signupToken}`;

    const emailResult = await sendDNALeaderInvitationEmail(
      normalizedEmail,
      name.trim(),
      signupUrl,
      churchName,
      inviterName,
      message
    );

    if (!emailResult.success) {
      console.error('[DNA Leaders] Email send error:', emailResult.error);
      // Don't fail the request - the record is created, they can resend
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
    if (!isSuperAdmin && session.churchId) {
      query = query.eq('church_id', session.churchId);
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
