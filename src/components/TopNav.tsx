import { getUnifiedSession, isAdmin } from '@/lib/unified-auth'
import Link from 'next/link'
import UserMenu from './UserMenu'

/**
 * Top navigation bar shown on all authenticated pages
 * Displays DNA Hub logo and user menu with role-based dashboard access
 */
export default async function TopNav() {
  const session = await getUnifiedSession()

  // Don't show nav if user is not logged in
  if (!session) {
    return null
  }

  const admin = isAdmin(session)

  return (
    <nav className="bg-[var(--navy)] text-white border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left: Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              <img
                src="/dna-logo-gold.png"
                alt="DNA Logo"
                className="h-10 w-auto"
              />
              <span className="text-xl font-semibold text-white">
                Discipleship
              </span>
            </Link>
          </div>

          {/* Center: Main nav links */}
          <div className="hidden md:flex items-center gap-1">
            <Link href="/groups" className="text-white/80 hover:text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">
              Groups
            </Link>
            <Link href="/cohort" className="text-white/80 hover:text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">
              Cohort
            </Link>
            <Link href="/training" className="text-white/80 hover:text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">
              Training
            </Link>
          </div>

          {/* Right: Admin badge + User menu */}
          <div className="flex items-center gap-4">
            {admin && (
              <Link
                href="/admin"
                className="px-3 py-1 bg-[var(--gold)] text-white text-xs font-semibold rounded-full hover:opacity-90 transition-opacity"
              >
                Admin
              </Link>
            )}
            <UserMenu session={session} />
          </div>
        </div>
      </div>
    </nav>
  )
}
