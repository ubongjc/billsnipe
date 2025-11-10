'use client'

import { Navigation, MobileNav } from './navigation'

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pb-20 md:pb-8">{children}</main>
      <MobileNav />
    </div>
  )
}
