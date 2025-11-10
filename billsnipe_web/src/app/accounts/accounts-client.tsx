'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface Account {
  id: string
  region: string
  provider: string | null
  accountNumber: string | null
  status: string
  createdAt: string
  stats: {
    usageRecords: number
    switchActions: number
    savingsReports: number
  }
}

interface AccountsClientProps {
  accounts: Account[]
}

export function AccountsClient({ accounts: initialAccounts }: AccountsClientProps) {
  const [accounts, setAccounts] = useState(initialAccounts)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    region: '',
    provider: '',
    accountNumber: '',
  })

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        setAccounts([...accounts, { ...data.account, stats: { usageRecords: 0, switchActions: 0, savingsReports: 0 } }])
        setShowAddDialog(false)
        setFormData({ region: '', provider: '', accountNumber: '' })
      }
    } catch (error) {
      console.error('Error adding account:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Utility Accounts</h1>
              <p className="text-sm text-muted-foreground">Manage your utility accounts and connections</p>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>Add Account</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {accounts.length === 0 ? (
          <Card>
            <CardContent className="pt-6 pb-6 text-center">
              <div className="mb-4 text-4xl">⚡</div>
              <h3 className="text-lg font-semibold mb-2">No accounts yet</h3>
              <p className="text-muted-foreground mb-4">Add your first utility account to start saving</p>
              <Button onClick={() => setShowAddDialog(true)}>Add Your First Account</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => (
              <Card key={account.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{account.provider || 'Unnamed Account'}</CardTitle>
                      <CardDescription>{account.region}</CardDescription>
                    </div>
                    <span className={cn('px-2 py-1 text-xs rounded-full', account.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800')}>
                      {account.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {account.accountNumber && (
                    <p className="text-sm text-muted-foreground mb-4">Account: {account.accountNumber}</p>
                  )}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold">{account.stats.usageRecords}</p>
                      <p className="text-xs text-muted-foreground">Usage Records</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{account.stats.switchActions}</p>
                      <p className="text-xs text-muted-foreground">Switches</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{account.stats.savingsReports}</p>
                      <p className="text-xs text-muted-foreground">Reports</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" className="flex-1" size="sm">View Details</Button>
                    <Button variant="outline" size="sm">Import Data</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add Utility Account</CardTitle>
              <CardDescription>Connect a new utility account to start tracking savings</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddAccount} className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-2">Region</label>
                  <Input
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    placeholder="e.g., Ontario, Texas, California"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Provider (optional)</label>
                  <Input
                    value={formData.provider}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                    placeholder="e.g., Hydro One, PG&E"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Account Number (optional)</label>
                  <Input
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    placeholder="Your account number"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? 'Adding...' : 'Add Account'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
