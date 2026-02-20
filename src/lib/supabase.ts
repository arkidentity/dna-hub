import { createClient } from '@supabase/supabase-js'
import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client (browser)
export function createClientSupabase() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Server-side Supabase client that reads/writes auth cookies.
// Use this in server components, API routes, and middleware
// when you need access to the logged-in user's session.
export async function createServerSupabase() {
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // setAll can fail in server components (read-only).
          // This is fine — the middleware handles refresh.
        }
      },
    },
  })
}

// Plain Supabase client (no auth session — for public/anon queries)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
