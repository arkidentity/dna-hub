import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { generateToken } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, churchName, churchSize, message } = body;

    // Validate required fields
    if (!name || !email || !churchName || !churchSize) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const firstName = name.split(' ')[0].trim();

    // =====================================================
    // 1. Create church record
    // =====================================================
    const { data: church, error: churchError } = await supabase
      .from('churches')
      .insert({
        name: churchName,
        status: 'pending_assessment',
      })
      .select('id')
      .single();

    if (churchError || !church) {
      console.error('Church insert error:', churchError);
      return NextResponse.json(
        { error: 'Failed to create church record' },
        { status: 500 }
      );
    }

    // =====================================================
    // 2. Save the inquiry (linked to new church)
    // =====================================================
    await supabase
      .from('spiritual_gifts_leader_inquiries')
      .insert({
        name,
        email: normalizedEmail,
        church_name: churchName,
        church_size: churchSize,
        message: message || null,
        church_id: church.id,
        access_granted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
    // Non-blocking — don't fail if this insert fails

    // =====================================================
    // 3. Create or find user
    // =====================================================
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
        .insert({ email: normalizedEmail, name })
        .select('id')
        .single();

      if (userError || !newUser) {
        console.error('User insert error:', userError);
        // Clean up church record
        await supabase.from('churches').delete().eq('id', church.id);
        return NextResponse.json(
          { error: 'Failed to create user account' },
          { status: 500 }
        );
      }
      userId = newUser.id;
    }

    // =====================================================
    // 4. Assign roles
    // =====================================================
    await supabase.from('user_roles').upsert(
      { user_id: userId, role: 'church_leader', church_id: church.id },
      { onConflict: 'user_id,role,church_id', ignoreDuplicates: true }
    );
    await supabase.from('user_roles').upsert(
      { user_id: userId, role: 'dna_leader', church_id: church.id },
      { onConflict: 'user_id,role,church_id', ignoreDuplicates: true }
    );
    // Training participant (global, no church)
    const { data: existingTraining } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('role', 'training_participant')
      .maybeSingle();
    if (!existingTraining) {
      await supabase.from('user_roles').insert({
        user_id: userId,
        role: 'training_participant',
        church_id: null,
      });
    }

    // =====================================================
    // 5. Create church_leaders record
    // =====================================================
    await supabase.from('church_leaders').insert({
      church_id: church.id,
      email: normalizedEmail,
      name,
      is_primary_contact: true,
      user_id: userId,
    });

    // =====================================================
    // 6. Create dna_leaders record (pre-activated)
    // =====================================================
    const { data: existingDNALeader } = await supabase
      .from('dna_leaders')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (!existingDNALeader) {
      await supabase.from('dna_leaders').insert({
        email: normalizedEmail,
        name,
        church_id: church.id,
        user_id: userId,
        is_active: true,
        activated_at: new Date().toISOString(),
      });
    }

    // =====================================================
    // 7. Generate magic link (7-day expiry)
    // =====================================================
    const magicToken = generateToken();
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 7);

    await supabase.from('magic_link_tokens').insert({
      email: normalizedEmail,
      token: magicToken,
      expires_at: tokenExpiresAt.toISOString(),
      used: false,
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hub.dnadiscipleship.com';
    const magicLink = `${baseUrl}/api/auth/verify?token=${magicToken}&destination=dashboard`;
    const adminChurchUrl = `${baseUrl}/admin/church/${church.id}`;

    // =====================================================
    // 8. Send emails
    // =====================================================
    if (resend) {
      // Welcome email to pastor with magic link
      await resend.emails.send({
        from: 'DNA Discipleship <noreply@dnadiscipleship.com>',
        to: normalizedEmail,
        subject: `Your Ministry Gifts Dashboard is Ready, ${firstName}!`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
            <h1 style="color: #1e3a5f;">Welcome to DNA Discipleship, ${firstName}!</h1>

            <p style="font-size: 16px; line-height: 1.6;">
              Your team dashboard for <strong>${churchName}</strong> has been created and is ready to use.
            </p>

            <div style="background: #f0f9ff; border: 2px solid #0ea5e9; border-radius: 12px; padding: 24px; margin: 28px 0; text-align: center;">
              <h2 style="color: #0c4a6e; margin-top: 0;">Access Your Dashboard</h2>
              <p style="color: #475569; margin-bottom: 20px;">
                Click the button below to log in — no password needed. This link expires in 7 days.
              </p>
              <a href="${magicLink}" style="display: inline-block; background: #1e3a5f; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Access My Dashboard →
              </a>
            </div>

            <h2 style="color: #1e3a5f;">What's Next?</h2>
            <ol style="font-size: 15px; line-height: 2;">
              <li>Take the assessment yourself at <a href="https://dailydna.app/gifts" style="color: #0ea5e9;">dailydna.app/gifts</a></li>
              <li>Share the link with your team members</li>
              <li>View everyone's results in your dashboard</li>
              <li>Place each person in their ministry sweet spot</li>
            </ol>

            <p style="margin-top: 32px; color: #64748b; font-size: 14px;">
              Questions? Reply to this email or reach us at
              <a href="mailto:support@dnadiscipleship.com" style="color: #0ea5e9;">support@dnadiscipleship.com</a>
            </p>

            <p style="color: #94a3b8; font-size: 12px;">
              DNA Discipleship — Building disciple-makers, one leader at a time
            </p>
          </div>
        `,
      }).catch((err) => console.error('Welcome email error:', err));

      // Internal notification with direct admin link
      await resend.emails.send({
        from: 'DNA Discipleship <noreply@dnadiscipleship.com>',
        to: 'thearkidentity@gmail.com',
        subject: `New Ministry Gifts Sign-up: ${churchName}`,
        html: `
          <div style="font-family: sans-serif;">
            <h2>New Ministry Gifts Team Request — Auto-Provisioned ✅</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${normalizedEmail}</p>
            <p><strong>Church:</strong> ${churchName}</p>
            <p><strong>Size:</strong> ${churchSize}</p>
            ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
            <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
            <hr />
            <p>
              <a href="${adminChurchUrl}" style="background: #1e3a5f; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600;">
                View in Admin Dashboard →
              </a>
            </p>
            <p style="color: #64748b; font-size: 13px;">
              Church ID: ${church.id}<br />
              A magic link has been sent to the pastor. No manual action needed.
            </p>
          </div>
        `,
      }).catch((err) => console.error('Internal notification email error:', err));
    }

    return NextResponse.json({ success: true, churchId: church.id });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
