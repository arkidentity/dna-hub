import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getSupabaseAdmin } from '@/lib/auth'

/**
 * OAuth / magic-link callback handler.
 * Supabase redirects here after Google OAuth or magic-link approval with a `code` param.
 * We exchange the code for a session, look up the user's role, and redirect to the
 * appropriate area (church leaders → /dashboard, DNA leaders → /groups,
 * training participants → /training).  An explicit `?next=` param always wins.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') // explicit override, if present

  if (code) {
    // Start with a /dashboard redirect; we'll update the Location header below
    // once we know the user's role.  Cookies are set on this response object.
    const response = NextResponse.redirect(new URL(next ?? '/dashboard', origin))

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const email = sessionData?.user?.email
      if (email) {
        const adminClient = getSupabaseAdmin()

        // Stamp last_login_at
        await adminClient
          .from('users')
          .update({ last_login_at: new Date().toISOString() })
          .eq('email', email.toLowerCase())

        // If no explicit next param, route by role so DNA leaders land directly
        // in /groups instead of bouncing through /dashboard first.
        if (!next) {
          const { data: userRecord } = await adminClient
            .from('users')
            .select('id, user_roles(role)')
            .eq('email', email.toLowerCase())
            .maybeSingle()

          const roles: string[] = ((userRecord as { user_roles?: { role: string }[] } | null)
            ?.user_roles ?? []).map(r => r.role)

          let dest = '/dashboard'
          if (roles.includes('admin') || roles.includes('church_leader')) {
            dest = '/dashboard'
          } else if (roles.includes('dna_coach')) {
            dest = '/admin'
          } else if (roles.includes('dna_leader')) {
            dest = '/cohort'
          } else if (roles.includes('training_participant')) {
            dest = '/training'
          }

          response.headers.set('Location', new URL(dest, origin).toString())
        }
      }
      return response
    }
  }

  // Auth code exchange failed — redirect to login with expired error
  // so the login page auto-switches to "resend setup link" mode
  return NextResponse.redirect(new URL('/login?error=expired', request.url))
}
