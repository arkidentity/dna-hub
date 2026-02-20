import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client (browser)
export function createClientSupabase() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Plain Supabase client (no auth session — for public/anon queries)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
