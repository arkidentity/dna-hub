'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { name: 'Groups', href: '/groups' },
  { name: 'Cohort', href: '/cohort' },
  { name: 'Training', href: '/training' },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <div className="flex md:hidden border-t border-gray-700">
      {tabs.map((tab) => {
        const active = pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`
              flex-1 text-center text-sm font-medium py-2.5 transition-colors
              ${active
                ? 'text-[var(--gold)] border-b-2 border-[var(--gold)]'
                : 'text-white/70 hover:text-white border-b-2 border-transparent'
              }
            `}
          >
            {tab.name}
          </Link>
        )
      })}
    </div>
  )
}
