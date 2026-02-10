'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserSession } from '@/lib/unified-auth'

interface UserMenuProps {
  session: UserSession
}

interface Dashboard {
  name: string
  href: string
  active: boolean
}

export default function UserMenu({ session }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Build dashboard list based on user roles
  const dashboards: Dashboard[] = []

  // My Church - for church leaders
  if (session.roles.some(r => r.role === 'church_leader')) {
    dashboards.push({
      name: 'My Church',
      href: '/dashboard',
      active: pathname.startsWith('/dashboard')
    })
  }

  // My Groups - for DNA leaders
  if (session.roles.some(r => r.role === 'dna_leader')) {
    dashboards.push({
      name: 'My Groups',
      href: '/groups',
      active: pathname.startsWith('/groups') && !pathname.startsWith('/groups/signup')
    })
  }

  // DNA Training - for training participants
  if (session.roles.some(r => r.role === 'training_participant')) {
    dashboards.push({
      name: 'DNA Training',
      href: '/training',
      active: pathname.startsWith('/training') && !pathname.startsWith('/training/signup')
    })
  }

  // Note: Admin users access /admin directly (no dropdown link)

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-white hover:text-[var(--gold)] transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="font-medium">{session.name || session.email}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {/* Dashboards section */}
          {dashboards.length > 0 && (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                My Dashboards
              </div>

              {dashboards.map((dashboard) => (
                <Link
                  key={dashboard.href}
                  href={dashboard.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    block px-4 py-2 text-sm hover:bg-gray-50 transition-colors
                    ${dashboard.active ? 'font-semibold text-[var(--navy)]' : 'text-gray-700'}
                  `}
                >
                  {dashboard.active && <span className="mr-2">✓</span>}
                  {dashboard.name}
                </Link>
              ))}

              <div className="border-t border-gray-200 my-2" />
            </>
          )}

          {/* User info */}
          <div className="px-4 py-2 text-sm text-gray-500">
            {session.email}
          </div>

          {/* Logout */}
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Logout
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
