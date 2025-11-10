'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { UserButton } from '@clerk/nextjs'
import { ThemeToggle } from '@/components/theme-toggle'

const routes = [
  { name: 'Dashboard', path: '/dashboard', icon: '📊' },
  { name: 'Accounts', path: '/accounts', icon: '⚡' },
  { name: 'Plans', path: '/plans', icon: '📋' },
  { name: 'Reports', path: '/reports', icon: '📈' },
  { name: 'Settings', path: '/settings', icon: '⚙️' },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <span className="text-xl font-bold">BillSnipe</span>
            </Link>

            <div className="hidden md:flex gap-6">
              {routes.map((route) => (
                <Link
                  key={route.path}
                  href={route.path}
                  className={cn(
                    'flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary',
                    pathname === route.path
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  )}
                >
                  <span>{route.icon}</span>
                  <span>{route.name}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium dark:bg-green-900 dark:text-green-200">
              <span>💰</span>
              <span>Saving Mode Active</span>
            </div>
            <ThemeToggle />
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>
    </nav>
  )
}

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background z-50">
      <div className="flex justify-around items-center h-16">
        {routes.slice(0, 4).map((route) => (
          <Link
            key={route.path}
            href={route.path}
            className={cn(
              'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors',
              pathname === route.path
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground'
            )}
          >
            <span className="text-xl">{route.icon}</span>
            <span className="text-xs font-medium">{route.name}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
