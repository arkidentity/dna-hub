/**
 * fix-missing-auth-accounts.mjs
 *
 * Creates Supabase Auth accounts for the 20 DNA leaders who have a `users`
 * record but no `auth.users` account, then sends each one a branded
 * password-setup email via Resend (bypasses Supabase email rate limits).
 *
 * What it does for each leader:
 *   1. supabase.auth.admin.createUser() — creates auth.users record silently
 *      (no Supabase email sent, email pre-confirmed)
 *   2. supabase.auth.admin.generateLink('recovery') — generates a password
 *      reset link valid for 24 hours
 *   3. Sends branded "Set up your password" email via Resend
 *
 * Usage:
 *   node scripts/fix-missing-auth-accounts.mjs
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY,
 *   NEXT_PUBLIC_APP_URL
 */

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ─── Load .env.local ───────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env.local');
const envVars = {};
try {
  const envFile = readFileSync(envPath, 'utf8');
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    envVars[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
  }
} catch {
  console.error('Could not read .env.local — run from the dna-hub root.');
  process.exit(1);
}

const SUPABASE_URL    = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const SERVICE_ROLE    = envVars['SUPABASE_SERVICE_ROLE_KEY'];
const RESEND_KEY      = envVars['RESEND_API_KEY'];
const APP_URL         = envVars['NEXT_PUBLIC_APP_URL'] || 'https://hub.dnadiscipleship.com';

if (!SUPABASE_URL || !SERVICE_ROLE || !RESEND_KEY) {
  console.error('Missing env vars — need NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const resend = new Resend(RESEND_KEY);

// ─── Leaders to fix ────────────────────────────────────────────────────────
const leaders = [
  { email: 'travis.gluckler@globalassociates.org', name: 'T Gluck' },
  { email: 'monicgrc@gmail.com',                   name: 'Monic Garcia' },
  { email: 'michael@crossculturedenver.org',        name: 'Michael Winakur' },
  { email: 'melissa.ruiz0117@gmail.com',            name: 'Melissa Ruiz' },
  { email: 'sy3914@yahoo.com',                      name: 'Sinahy Ruiz' },
  { email: 'kfitten88@gmail.com',                   name: 'Kimberly Fitten' },
  { email: 'agray13@gmail.com',                     name: 'Andrea Gray' },
  { email: 'jaygray13@gmail.com',                   name: 'John Gray' },
  { email: 'vhenry@blvd.church',                    name: 'Virsavia Henry' },
  { email: 'marzettesteward@gmail.com',             name: 'Marzette Steward' },
  { email: 'ewillisblvd@gmail.com',                 name: 'Erick Willis' },
  { email: 'xxxforeveryoung@gmail.com',             name: 'William Perry' },
  { email: 'gcphillips@cox.net',                    name: 'Glenn Phillips' },
  { email: 'aamirwalton@gmail.com',                 name: 'Aamir Walton' },
  { email: 'bplus007@gmail.com',                    name: 'Baruky Ruiz' },
  { email: 'sglover@purposeplaceia.org',            name: 'S Glover' },
  { email: 'transformationchurchlv@gmail.com',      name: 'Pastor Ron Wilson' },
  { email: 'tgluckler@gmail.com',                   name: 'Trent Gluckler' },
];

// ─── Email template ────────────────────────────────────────────────────────
function buildEmail(name, resetLink) {
  const firstName = name.split(' ')[0];
  return {
    subject: 'Set up your DNA Hub password',
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1A2332;">Hi ${firstName},</h2>

        <p>Your DNA Hub leader account is ready. Click the button below to set your password and log in:</p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetLink}"
             style="background: #D4A853; color: white; padding: 16px 32px;
                    border-radius: 8px; text-decoration: none; font-weight: 500;
                    display: inline-block;">
            Set Up My Password
          </a>
        </div>

        <p style="color: #5A6577; font-size: 14px;">
          This link expires in 24 hours. After setting your password you can always
          log back in at <a href="${APP_URL}/login" style="color: #2D6A6A;">${APP_URL}/login</a>.
        </p>

        <p style="color: #5A6577; font-size: 14px;">
          Or copy this link:<br>
          <a href="${resetLink}" style="color: #2D6A6A; word-break: break-all;">${resetLink}</a>
        </p>

        <hr style="border: none; border-top: 1px solid #E8DDD0; margin: 32px 0;" />

        <p style="color: #5A6577; font-size: 14px;">
          Making disciples who make disciples,<br>
          <strong>ARK Identity / DNA Discipleship Team</strong>
        </p>
      </div>
    `,
  };
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function run() {
  console.log(`\n🔧 Fixing auth accounts for ${leaders.length} leaders...\n`);
  const results = { success: [], failed: [] };

  for (const leader of leaders) {
    const email = leader.email.toLowerCase().trim();

    try {
      // Step 1 — create auth.users record (silent, no Supabase email)
      let authUserId;
      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,   // mark email as confirmed — no confirmation email sent
        user_metadata: { name: leader.name, signup_source: 'admin_fix_missing_auth' },
      });

      if (createError) {
        if (createError.message?.includes('already been registered') || createError.message?.includes('already exists')) {
          // Auth account already exists — look it up
          const { data: { users } } = await supabase.auth.admin.listUsers();
          const existing = users.find(u => u.email === email);
          if (existing) {
            authUserId = existing.id;
            console.log(`  ⏭️  ${email} — auth account already existed, generating reset link`);
          } else {
            throw new Error('Could not find existing auth user');
          }
        } else {
          throw new Error(createError.message);
        }
      } else {
        authUserId = created.user.id;
        console.log(`  ✅ ${email} — auth account created`);
      }

      // Step 2 — generate a password reset link (24hr expiry, no email sent by Supabase)
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: { redirectTo: `${APP_URL}/login` },
      });

      if (linkError) throw new Error(`generateLink failed: ${linkError.message}`);

      const resetLink = linkData.properties?.action_link;
      if (!resetLink) throw new Error('No action_link returned from generateLink');

      // Step 3 — send branded email via Resend
      const { subject, html } = buildEmail(leader.name, resetLink);
      const { error: emailError } = await resend.emails.send({
        from: 'DNA Discipleship <notifications@mail.dnadiscipleship.com>',
        to: email,
        subject,
        html,
      });

      if (emailError) throw new Error(`Resend error: ${emailError.message}`);

      console.log(`  📧 ${email} — password setup email sent`);
      results.success.push(leader);

    } catch (err) {
      console.error(`  ❌ ${email} — ${err.message}`);
      results.failed.push({ ...leader, error: err.message });
    }

    // Small delay between requests
    await new Promise(r => setTimeout(r, 200));
  }

  console.log('\n─────────────────────────────────────');
  console.log(`✅ Success: ${results.success.length}`);
  console.log(`❌ Failed:  ${results.failed.length}`);

  if (results.failed.length > 0) {
    console.log('\nFailed — re-run or handle manually:');
    for (const f of results.failed) {
      console.log(`  • ${f.email}: ${f.error}`);
    }
  }

  console.log('\nAll done. Leaders will receive a "Set up your password" email from noreply@dnadiscipleship.com\n');
}

run();
