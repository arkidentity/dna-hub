import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { sendEmail } from '@/lib/email';

// Use admin client so we can call supabase.auth.admin.createUser
const supabase = getSupabaseAdmin();


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
    // NOTE: user_roles has a partial unique index (WHERE church_id IS NOT NULL),
    // so upsert with onConflict won't match it reliably — check first, then insert.
    // =====================================================
    const { data: existingChurchLeaderRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('role', 'church_leader')
      .eq('church_id', church.id)
      .maybeSingle();
    if (!existingChurchLeaderRole) {
      const { error: clRoleError } = await supabase.from('user_roles').insert({
        user_id: userId, role: 'church_leader', church_id: church.id,
      });
      if (clRoleError) console.error('[Leader Inquiry] Failed to insert church_leader role:', clRoleError);
    }

    const { data: existingDnaLeaderRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('role', 'dna_leader')
      .eq('church_id', church.id)
      .maybeSingle();
    if (!existingDnaLeaderRole) {
      const { error: dlRoleError } = await supabase.from('user_roles').insert({
        user_id: userId, role: 'dna_leader', church_id: church.id,
      });
      if (dlRoleError) console.error('[Leader Inquiry] Failed to insert dna_leader role:', dlRoleError);
    }
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
    // 7. Create Supabase Auth account silently (no Supabase email, no rate limits).
    //    email_confirm: true so they can log in immediately via password or Google OAuth.
    // =====================================================
    {
      const { error: authCreateError } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        email_confirm: true,
        user_metadata: { name, signup_source: 'ministry_gifts_inquiry' },
      });
      if (authCreateError &&
          !authCreateError.message?.includes('already been registered') &&
          !authCreateError.message?.includes('already exists')) {
        console.error('[Leader Inquiry] Auth account creation error:', authCreateError.message);
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hub.dnadiscipleship.com';
    const loginUrl = `${baseUrl}/login`;
    const adminChurchUrl = `${baseUrl}/admin/church/${church.id}`;

    // =====================================================
    // 8. Send emails
    // =====================================================
    // Welcome email to pastor — directs them to set up password or use Google
    await sendEmail({
      to: normalizedEmail,
      subject: `${firstName}, your Ministry Gifts dashboard is ready`,
      html: `
          <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f7f4ef; color: #0f0e0c;">

            <!-- Header -->
            <div style="background: #1A2332; padding: 24px 32px; display: flex; align-items: center;">
              <span style="font-family: Georgia, serif; font-size: 1.1rem; font-weight: 700; color: #D4A853; letter-spacing: 0.08em; text-transform: uppercase;">DNA Discipleship</span>
            </div>

            <!-- Body -->
            <div style="padding: 40px 32px;">
              <p style="font-size: 0.8rem; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #D4A853; margin: 0 0 1rem 0;">You're in, ${firstName}</p>

              <h1 style="font-family: Georgia, 'Playfair Display', serif; font-size: 2rem; font-weight: 900; line-height: 1.15; color: #0f0e0c; margin: 0 0 1.25rem 0;">
                Your team dashboard<br/>is ready to use.
              </h1>

              <p style="font-size: 1rem; line-height: 1.75; color: #6b6560; margin: 0 0 2rem 0;">
                We've set up a church dashboard for <strong style="color: #0f0e0c;">${churchName}</strong>. Your unique assessment link is waiting inside — send it to as many leaders as you need. Results flow directly to your dashboard as each person completes the assessment.
              </p>

              <!-- CTA -->
              <div style="background: #1A2332; padding: 28px 32px; margin: 0 0 2rem 0; text-align: center;">
                <p style="font-size: 0.8rem; letter-spacing: 0.15em; text-transform: uppercase; color: #D4A853; margin: 0 0 0.75rem 0;">Set up your password or sign in with Google</p>
                <a href="${loginUrl}" style="display: inline-block; background: #D4A853; color: #0f0e0c; padding: 14px 32px; text-decoration: none; font-weight: 700; font-size: 0.95rem; letter-spacing: 0.04em;">
                  Access My Dashboard →
                </a>
                <p style="font-size: 0.78rem; color: rgba(247,244,239,0.4); margin: 1rem 0 0 0;">
                  Click "First time? Set up your password" or "Continue with Google" using <strong style="color: rgba(247,244,239,0.6);">${normalizedEmail}</strong>
                </p>
              </div>

              <!-- Next steps -->
              <p style="font-size: 0.75rem; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #D4A853; margin: 0 0 1rem 0;">What to do next</p>
              <table style="width: 100%; border-collapse: collapse;">
                ${[
                  ['Take the assessment yourself', 'Visit dailydna.app/gifts to complete your own profile first.'],
                  ['Send the link to your team', 'Your dashboard includes a unique link — forward it to leaders, volunteers, anyone you want assessed.'],
                  ['Review results as they come in', 'Every completed assessment flows directly to your dashboard in real time.'],
                  ['Place people in their sweet spot', 'Use the gift profiles to match each person to the role they were built for.'],
                ].map(([title, body], i) => `
                  <tr>
                    <td style="padding: 0.85rem 0; border-bottom: 1px solid #ddd8cf; vertical-align: top; width: 24px;">
                      <span style="font-family: Georgia, serif; font-size: 1.1rem; font-weight: 900; color: #ddd8cf; line-height: 1;">${String(i + 1).padStart(2, '0')}</span>
                    </td>
                    <td style="padding: 0.85rem 0 0.85rem 1rem; border-bottom: 1px solid #ddd8cf;">
                      <strong style="font-size: 0.92rem; color: #0f0e0c;">${title}</strong><br/>
                      <span style="font-size: 0.85rem; color: #6b6560; line-height: 1.6;">${body}</span>
                    </td>
                  </tr>
                `).join('')}
              </table>

              <p style="font-size: 0.88rem; color: #6b6560; line-height: 1.7; margin: 2rem 0 0 0;">
                Questions? Just reply to this email — we read every one.<br/>
                <a href="mailto:info@dnadiscipleship.com" style="color: #D4A853; text-decoration: none;">info@dnadiscipleship.com</a>
              </p>
            </div>

            <!-- Footer -->
            <div style="background: #2a2825; padding: 20px 32px; text-align: center;">
              <p style="font-size: 0.75rem; color: rgba(247,244,239,0.35); margin: 0;">
                DNA Discipleship &mdash; dnadiscipleship.com<br/>
                <a href="https://dnadiscipleship.com" style="color: rgba(247,244,239,0.35); text-decoration: none;">dnadiscipleship.com</a>
              </p>
            </div>

          </div>
        `,
    }).catch((err) => console.error('Welcome email error:', err));

    // Internal notification to you with direct admin link
    await sendEmail({
      to: 'info@dnadiscipleship.com',
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
              Account created — pastor directed to set up password or use Google OAuth.
            </p>
          </div>
        `,
    }).catch((err) => console.error('Internal notification email error:', err));

    return NextResponse.json({ success: true, churchId: church.id });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
