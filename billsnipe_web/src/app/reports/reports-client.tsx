'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useState } from 'react'
import { toast } from 'sonner'

interface Report {
  id: string
  month: string
  baseline: number
  actual: number
  savings: number
  verified: boolean
  accountProvider: string | null
}

export function ReportsClient({ reports }: { reports: Report[] }) {
  const [timeRange, setTimeRange] = useState('6m')

  const chartData = reports
    .slice(0, timeRange === '3m' ? 3 : timeRange === '6m' ? 6 : 12)
    .reverse()
    .map((report) => ({
      month: new Date(report.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      baseline: report.baseline,
      actual: report.actual,
      savings: report.savings,
    }))

  const totalSavings = reports.reduce((sum, r) => sum + r.savings, 0)
  const averageSavings = reports.length > 0 ? totalSavings / reports.length : 0
  const verifiedSavings = reports.filter(r => r.verified).reduce((sum, r) => sum + r.savings, 0)

  const handleExport = () => {
    const csv = [
      ['Month', 'Provider', 'Baseline', 'Actual', 'Savings', 'Verified'].join(','),
      ...reports.map(r => [
        new Date(r.month).toLocaleDateString(),
        r.accountProvider || 'N/A',
        r.baseline,
        r.actual,
        r.savings,
        r.verified
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `billsnipe-reports-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Report exported successfully!')
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Savings Reports</h1>
              <p className="text-sm text-muted-foreground">Track your savings over time</p>
            </div>
            <Button onClick={handleExport} variant="outline">
              <span className="mr-2">📥</span>
              Export CSV
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardDescription>Total Savings</CardDescription>
              <CardTitle className="text-3xl">${totalSavings.toFixed(2)}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Average Monthly</CardDescription>
              <CardTitle className="text-3xl">${averageSavings.toFixed(2)}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Verified Savings</CardDescription>
              <CardTitle className="text-3xl text-green-600">${verifiedSavings.toFixed(2)}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Savings Trend</CardTitle>
                <CardDescription>Your savings over time</CardDescription>
              </div>
              <div className="flex gap-2">
                {['3m', '6m', '12m'].map((range) => (
                  <Button
                    key={range}
                    variant={timeRange === range ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeRange(range)}
                  >
                    {range.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="savings" stroke="#22c55e" strokeWidth={2} name="Savings" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Cost Comparison</CardTitle>
            <CardDescription>Baseline vs Actual Costs</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="baseline" fill="#ef4444" name="Baseline Cost" />
                <Bar dataKey="actual" fill="#3b82f6" name="Actual Cost" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detailed Reports</CardTitle>
            <CardDescription>All savings reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Month</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Provider</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Baseline</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Actual</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Savings</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 text-sm">
                        {new Date(report.month).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                      </td>
                      <td className="px-4 py-3 text-sm">{report.accountProvider || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-right">${report.baseline.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-right">${report.actual.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                        ${report.savings.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {report.verified ? (
                          <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                            <span>✓</span>
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
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
