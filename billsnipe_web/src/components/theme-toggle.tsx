'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Only render after mounting to avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="outline" size="sm" disabled>
        <span className="sr-only">Toggle theme</span>
        <span className="text-lg">🌓</span>
      </Button>
    )
  }

  const isDark = theme === 'dark'

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="gap-2"
    >
      <span className="text-lg">{isDark ? '🌙' : '☀️'}</span>
      <span className="hidden sm:inline">
        {isDark ? 'Dark' : 'Light'}
      </span>
    </Button>
  )
}

export function ThemeSelect() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <select disabled className="px-3 py-2 border rounded-md bg-background">
        <option>Loading...</option>
      </select>
    )
  }

  return (
    <select
      value={theme}
      onChange={(e) => setTheme(e.target.value)}
      className="px-3 py-2 border rounded-md bg-background"
    >
      <option value="system">System</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  )
}
