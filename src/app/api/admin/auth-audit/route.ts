import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUnifiedSession, isAdmin } from '@/lib/unified-auth';

export interface AuditUser {
  id: string;
  email: string;
  name: string | null;
  roles: string[];
  created_at: string;
  hasAuthAccount: boolean;
  authEmailConfirmed: boolean;
}

export interface AuthAuditResult {
  summary: {
    totalUsers: number;
    withAuthAccount: number;
    missingAuthAccount: number;
    withoutRoles: number;
    unconfirmedEmail: number;
  };
  missingAuth: AuditUser[];   // In users table but not in auth.users
  noRoles: AuditUser[];       // In auth.users but have no roles
  unconfirmed: AuditUser[];   // In auth.users but email_confirmed_at is null
}

/**
 * GET /api/admin/auth-audit
 *
 * Cross-checks the `users` table (your app's source of truth) against
 * Supabase auth.users to find anyone who can't log in:
 *
 * 1. Missing auth account — exists in `users` but not in auth.users
 *    → They have NO login method at all. Must be fixed.
 *
 * 2. No roles — exists in auth but has no user_roles rows
 *    → They can log in but land on an empty dashboard.
 *
 * 3. Unconfirmed email — auth account exists but email_confirmed_at is null
 *    → Password/Google auth won't work. Supabase requires confirmed emails.
 */
export async function GET(request: NextRequest) {
  const session = await getUnifiedSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 1. Fetch all app users with their roles
    const { data: appUsers, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        created_at,
        user_roles (
          role
        )
      `)
      .order('created_at', { ascending: false });

    if (usersError) throw usersError;

    // 2. Fetch ALL Supabase auth users (paginated — handles large lists)
    const authUserMap = new Map<string, { emailConfirmedAt: string | null }>();
    let page = 1;
    const perPage = 1000;

    while (true) {
      const { data: authPage, error: authError } = await supabase.auth.admin.listUsers({
        page,
        perPage,
      });

      if (authError) throw authError;
      if (!authPage?.users?.length) break;

      authPage.users.forEach((u) => {
        authUserMap.set(u.email!.toLowerCase(), {
          emailConfirmedAt: u.email_confirmed_at || null,
        });
      });

      // If we got fewer than perPage, we've reached the last page
      if (authPage.users.length < perPage) break;
      page++;
    }

    // 3. Cross-reference
    const missingAuth: AuditUser[] = [];
    const noRoles: AuditUser[] = [];
    const unconfirmed: AuditUser[] = [];

    for (const user of appUsers || []) {
      const roles = (user.user_roles || []).map((r: { role: string }) => r.role);
      const email = user.email.toLowerCase();
      const authEntry = authUserMap.get(email);

      const auditUser: AuditUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        roles,
        created_at: user.created_at,
        hasAuthAccount: !!authEntry,
        authEmailConfirmed: authEntry ? !!authEntry.emailConfirmedAt : false,
      };

      if (!authEntry) {
        missingAuth.push(auditUser);
      } else {
        if (!authEntry.emailConfirmedAt) {
          unconfirmed.push(auditUser);
        }
        if (roles.length === 0) {
          noRoles.push(auditUser);
        }
      }
    }

    const result: AuthAuditResult = {
      summary: {
        totalUsers: appUsers?.length || 0,
        withAuthAccount: (appUsers?.length || 0) - missingAuth.length,
        missingAuthAccount: missingAuth.length,
        withoutRoles: noRoles.length,
        unconfirmedEmail: unconfirmed.length,
      },
      missingAuth,
      noRoles,
      unconfirmed,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('[auth-audit] Error:', error);
    return NextResponse.json({ error: 'Failed to run auth audit' }, { status: 500 });
  }
}

/**
 * POST /api/admin/auth-audit
 * Body: { action: 'fix_missing', emails?: string[] }
 *
 * Creates Supabase auth accounts (email_confirm: true) for any app users
 * who are missing one. Optionally send them a setup link via email.
 *
 * If emails[] is provided, only fix those users; otherwise fix ALL missing.
 */
export async function POST(request: NextRequest) {
  const session = await getUnifiedSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { action, emails } = body;

  if (action !== 'fix_missing') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dnadiscipleship.com';

  try {
    // Determine which users to fix
    let usersToFix: { email: string; name: string | null }[] = [];

    if (emails && Array.isArray(emails) && emails.length > 0) {
      // Fix specific emails
      const { data } = await supabase
        .from('users')
        .select('email, name')
        .in('email', emails.map((e: string) => e.toLowerCase()));
      usersToFix = data || [];
    } else {
      // Fix all missing — run the same cross-reference as GET
      const { data: appUsers } = await supabase
        .from('users')
        .select('email, name');

      const { data: authPage } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const authEmails = new Set(
        (authPage?.users || []).map((u) => u.email!.toLowerCase())
      );

      usersToFix = (appUsers || []).filter(
        (u) => !authEmails.has(u.email.toLowerCase())
      );
    }

    const results = {
      fixed: 0,
      failed: 0,
      details: [] as Array<{ email: string; status: 'fixed' | 'failed'; error?: string }>,
    };

    for (const user of usersToFix) {
      const normalizedEmail = user.email.toLowerCase();
      try {
        // Create auth account (email_confirm: true = skip verification email)
        const { error: createError } = await supabase.auth.admin.createUser({
          email: normalizedEmail,
          email_confirm: true,
          user_metadata: { name: user.name, signup_source: 'auth_audit_fix' },
        });

        if (createError &&
          !createError.message?.includes('already been registered') &&
          !createError.message?.includes('already exists')) {
          throw createError;
        }

        results.fixed++;
        results.details.push({ email: normalizedEmail, status: 'fixed' });
      } catch (err) {
        results.failed++;
        results.details.push({
          email: normalizedEmail,
          status: 'failed',
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    // After fixing, generate recovery links for all fixed users so admin can send them
    const recoveryLinks: Record<string, string> = {};
    for (const detail of results.details.filter((d) => d.status === 'fixed')) {
      try {
        const { data: linkData } = await supabase.auth.admin.generateLink({
          type: 'recovery',
          email: detail.email,
          options: { redirectTo: `${baseUrl}/auth/reset-password` },
        });
        if (linkData?.properties?.action_link) {
          recoveryLinks[detail.email] = linkData.properties.action_link;
        }
      } catch {
        // Non-critical — skip if link generation fails
      }
    }

    return NextResponse.json({ ...results, recoveryLinks });
  } catch (error) {
    console.error('[auth-audit] Fix error:', error);
    return NextResponse.json({ error: 'Failed to fix accounts' }, { status: 500 });
  }
}
