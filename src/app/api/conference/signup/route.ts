import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      church_name,
      church_location,
      subdomain,
      primary_color,
      accent_color,
    } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 });
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (!church_name || typeof church_name !== 'string' || church_name.trim().length < 2) {
      return NextResponse.json({ error: 'Please enter your church name.' }, { status: 400 });
    }
    if (!subdomain || typeof subdomain !== 'string' || !/^[a-z0-9-]+$/.test(subdomain)) {
      return NextResponse.json(
        { error: 'Subdomain can only contain lowercase letters, numbers, and hyphens.' },
        { status: 400 }
      );
    }

    // Validate hex colors
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (primary_color && !hexColorRegex.test(primary_color)) {
      return NextResponse.json({ error: 'Invalid primary color format.' }, { status: 400 });
    }
    if (accent_color && !hexColorRegex.test(accent_color)) {
      return NextResponse.json({ error: 'Invalid accent color format.' }, { status: 400 });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedChurchName = church_name.trim();
    const trimmedPhone = phone?.trim() || '';
    const trimmedLocation = church_location?.trim() || '';
    const trimmedSubdomain = subdomain.trim().toLowerCase();

    const supabase = getSupabaseAdmin();

    // Check if subdomain is already taken
    const { data: existingChurch } = await supabase
      .from('churches')
      .select('id')
      .eq('subdomain', trimmedSubdomain)
      .single();

    if (existingChurch) {
      return NextResponse.json(
        { error: 'This subdomain is already taken. Please choose another.' },
        { status: 409 }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', trimmedEmail)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please log in at dnadiscipleship.com/login.' },
        { status: 400 }
      );
    }

    // 1. Create the church record
    const { data: newChurch, error: churchError } = await supabase
      .from('churches')
      .insert({
        name: trimmedChurchName,
        subdomain: trimmedSubdomain,
        primary_color: primary_color || '#143348',
        accent_color: accent_color || '#e8b562',
        contact_email: trimmedEmail,
        status: 'active',
      })
      .select('id')
      .single();

    if (churchError || !newChurch) {
      console.error('[Conference Signup] Error creating church:', churchError);
      return NextResponse.json(
        { error: 'Failed to create church. Please try again.' },
        { status: 500 }
      );
    }

    // 2. Create church_branding_settings with defaults
    const { error: brandingError } = await supabase
      .from('church_branding_settings')
      .insert({
        church_id: newChurch.id,
        app_title: trimmedChurchName,
        app_description: 'Daily discipleship tools',
        theme_color: primary_color || '#143348',
        header_style: 'text',
      });

    if (brandingError) {
      console.error('[Conference Signup] Error creating branding settings:', brandingError);
      // Non-fatal — church is created
    }

    // 3. Create user account
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        email: trimmedEmail,
        name: trimmedName,
      })
      .select('id')
      .single();

    if (userError || !newUser) {
      console.error('[Conference Signup] Error creating user:', userError);
      return NextResponse.json(
        { error: 'Failed to create account. Please try again.' },
        { status: 500 }
      );
    }

    // 4. Add church_leader role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: newUser.id,
        role: 'church_leader',
        church_id: newChurch.id,
      });

    if (roleError) {
      console.error('[Conference Signup] Error adding role:', roleError);
    }

    // 5. Create church_leaders record
    await supabase.from('church_leaders').insert({
      name: trimmedName,
      email: trimmedEmail,
      church_id: newChurch.id,
      user_id: newUser.id,
      role: 'lead_pastor',
      is_primary_contact: true,
    });

    // 6. Create magic link token for login
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await supabase.from('magic_link_tokens').insert({
      email: trimmedEmail,
      token,
      expires_at: expiresAt.toISOString(),
      used: false,
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dnadiscipleship.com';
    const loginLink = `${baseUrl}/api/auth/verify?token=${token}&destination=dashboard`;
    const appUrl = `https://${trimmedSubdomain}.dailydna.app`;

    // 7. Send welcome email to pastor
    await sendEmail({
      to: trimmedEmail,
      subject: `${trimmedChurchName} is now on DNA Daily!`,
      html: buildWelcomeEmail(trimmedName, trimmedChurchName, appUrl, loginLink),
      churchId: newChurch.id,
      notificationType: 'conference_signup',
    });

    // 8. Notify Travis
    await sendEmail({
      to: 'info@dnadiscipleship.com',
      subject: `New Conference Signup: ${trimmedChurchName}`,
      html: buildNotificationEmail(trimmedName, trimmedEmail, trimmedPhone, trimmedChurchName, trimmedLocation, trimmedSubdomain, appUrl),
      notificationType: 'conference_signup_notification',
    });

    const isDev = process.env.NODE_ENV === 'development';

    return NextResponse.json({
      success: true,
      church_id: newChurch.id,
      subdomain: trimmedSubdomain,
      app_url: appUrl,
      ...(isDev && { devLink: loginLink }),
    });
  } catch (error) {
    console.error('[Conference Signup] Error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

// ── Email Templates ──────────────────────────────────────────────

function buildWelcomeEmail(name: string, churchName: string, appUrl: string, loginLink: string) {
  return `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; background: #1A2332; color: #FFFFFF;">
      <div style="padding: 40px 32px; text-align: center;">
        <h1 style="color: #D4A853; margin: 0 0 8px 0; font-size: 28px;">Your App Is Live!</h1>
        <p style="color: #A0AEC0; margin: 0; font-size: 16px;">${churchName} is now on DNA Daily</p>
      </div>

      <div style="background: #FFFBF5; padding: 32px; color: #1A2332;">
        <h2 style="margin: 0 0 16px 0; color: #1A2332;">Hey ${name},</h2>

        <p style="color: #5A6577; line-height: 1.6;">Great news — your white-labeled discipleship app is live and ready to go!</p>

        <div style="background: #F4E7D7; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: center;">
          <h3 style="color: #1A2332; margin: 0 0 8px 0;">Your App URL</h3>
          <a href="${appUrl}" style="color: #D4A853; font-size: 18px; font-weight: 600; text-decoration: none;">${appUrl}</a>
        </div>

        <p style="color: #5A6577; line-height: 1.6;">Share this link with your people — they can install it as an app on their phone right from the browser.</p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${loginLink}"
             style="background: #D4A853; color: #1A2332; padding: 16px 32px;
                    border-radius: 8px; text-decoration: none; font-weight: 600;
                    display: inline-block; font-size: 16px;">
            Access Your Dashboard
          </a>
        </div>

        <h3 style="color: #1A2332; margin: 24px 0 12px 0;">What You Can Do Next:</h3>
        <ol style="color: #5A6577; margin: 0; padding-left: 20px; line-height: 1.8;">
          <li><strong>Upload your logo</strong> — Customize your app's look</li>
          <li><strong>Add custom links</strong> — Connect your church website, giving page, etc.</li>
          <li><strong>Invite your people</strong> — Share your app URL</li>
          <li><strong>Start a DNA Group</strong> — Begin making disciples</li>
        </ol>

        <hr style="border: none; border-top: 1px solid #E8DDD0; margin: 32px 0;" />

        <p style="color: #5A6577; margin: 0;">
          Making disciples who make disciples,<br>
          <strong style="color: #1A2332;">The DNA Team</strong>
        </p>
      </div>
    </div>
  `;
}

function buildNotificationEmail(
  name: string,
  email: string,
  phone: string | undefined,
  churchName: string,
  location: string,
  subdomain: string,
  appUrl: string
) {
  return `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
      <h2 style="color: #1A2332; margin: 0 0 24px 0;">New Conference Signup!</h2>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 16px; font-weight: 600; color: #1A2332; border-bottom: 1px solid #E8DDD0;">Name</td>
          <td style="padding: 8px 16px; color: #5A6577; border-bottom: 1px solid #E8DDD0;">${name}</td>
        </tr>
        <tr>
          <td style="padding: 8px 16px; font-weight: 600; color: #1A2332; border-bottom: 1px solid #E8DDD0;">Email</td>
          <td style="padding: 8px 16px; color: #5A6577; border-bottom: 1px solid #E8DDD0;"><a href="mailto:${email}">${email}</a></td>
        </tr>
        <tr>
          <td style="padding: 8px 16px; font-weight: 600; color: #1A2332; border-bottom: 1px solid #E8DDD0;">Phone</td>
          <td style="padding: 8px 16px; color: #5A6577; border-bottom: 1px solid #E8DDD0;">${phone || 'Not provided'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 16px; font-weight: 600; color: #1A2332; border-bottom: 1px solid #E8DDD0;">Church</td>
          <td style="padding: 8px 16px; color: #5A6577; border-bottom: 1px solid #E8DDD0;">${churchName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 16px; font-weight: 600; color: #1A2332; border-bottom: 1px solid #E8DDD0;">Location</td>
          <td style="padding: 8px 16px; color: #5A6577; border-bottom: 1px solid #E8DDD0;">${location || 'Not provided'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 16px; font-weight: 600; color: #1A2332; border-bottom: 1px solid #E8DDD0;">Subdomain</td>
          <td style="padding: 8px 16px; color: #5A6577; border-bottom: 1px solid #E8DDD0;">${subdomain}</td>
        </tr>
        <tr>
          <td style="padding: 8px 16px; font-weight: 600; color: #1A2332;">App URL</td>
          <td style="padding: 8px 16px;"><a href="${appUrl}" style="color: #D4A853;">${appUrl}</a></td>
        </tr>
      </table>
    </div>
  `;
}
