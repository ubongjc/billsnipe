'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface DashboardClientProps {
  user: {
    id: string
    email: string
    role: string
  }
  accounts: Array<{
    id: string
    provider: string | null
    region: string
    status: string
    pendingSwitches: number
  }>
  totalSavings: number
  recentReports: Array<{
    id: string
    month: string
    savings: number
    baseline: number
    actual: number
    verified: boolean
    provider: string | null
  }>
}

export function DashboardClient({
  user,
  accounts,
  totalSavings,
  recentReports,
}: DashboardClientProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('all')

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Time</option>
                <option value="year">This Year</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="col-span-full lg:col-span-2 rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Savings</p>
                <h2 className="text-4xl font-bold mt-2">${totalSavings.toFixed(2)}</h2>
                <p className="text-sm text-green-600 mt-1">Keep saving with BillSnipe</p>
              </div>
              <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-3xl">=°</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <p className="text-sm font-medium text-muted-foreground">Active Accounts</p>
            <h3 className="text-3xl font-bold mt-2">{accounts.length}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {accounts.filter((a) => a.pendingSwitches > 0).length} pending switches
            </p>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Your Accounts</h2>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
              Add Account
            </button>
          </div>

          {accounts.length === 0 ? (
            <div className="rounded-lg border bg-card p-8 text-center">
              <p className="text-muted-foreground">
                No accounts yet. Add your first utility account to start saving!
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {accounts.map((account) => (
                <div key={account.id} className="rounded-lg border bg-card p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{account.provider || 'Unnamed Account'}</h3>
                      <p className="text-sm text-muted-foreground">{account.region}</p>
                    </div>
                    <span className={cn('px-2 py-1 text-xs rounded-full', account.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800')}>
                      {account.status}
                    </span>
                  </div>
                  {account.pendingSwitches > 0 && (
                    <div className="mt-3 text-sm text-amber-600">
                      {account.pendingSwitches} pending switch{account.pendingSwitches > 1 ? 'es' : ''}
                    </div>
                  )}
                  <button className="mt-4 w-full px-3 py-2 text-sm border rounded-md hover:bg-accent">
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Recent Savings</h2>
          {recentReports.length === 0 ? (
            <div className="rounded-lg border bg-card p-8 text-center">
              <p className="text-muted-foreground">
                No savings reports yet. Import your usage data to see your savings!
              </p>
            </div>
          ) : (
            <div className="rounded-lg border bg-card overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium">Month</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Provider</th>
                    <th className="px-6 py-3 text-right text-sm font-medium">Baseline</th>
                    <th className="px-6 py-3 text-right text-sm font-medium">Actual</th>
                    <th className="px-6 py-3 text-right text-sm font-medium">Savings</th>
                    <th className="px-6 py-3 text-center text-sm font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentReports.map((report) => (
                    <tr key={report.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 text-sm">
                        {new Date(report.month).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                      </td>
                      <td className="px-6 py-4 text-sm">{report.provider || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-right">${report.baseline.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-right">${report.actual.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-right font-medium text-green-600">
                        ${report.savings.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {report.verified ? (
                          <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Verified
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
