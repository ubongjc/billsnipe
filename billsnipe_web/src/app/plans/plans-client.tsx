'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Account {
  id: string
  provider: string | null
  region: string
}

interface PlanComparison {
  planId: string
  planName: string
  provider: string
  estimatedMonthlyCost: number
  estimatedAnnualSavings: number
  planType: string
  features: string[]
}

export function PlansClient({ accounts }: { accounts: Account[] }) {
  const [selectedAccount, setSelectedAccount] = useState(accounts[0]?.id || '')
  const [loading, setLoading] = useState(false)
  const [comparisons, setComparisons] = useState<PlanComparison[]>([])
  const [currentPlan, setCurrentPlan] = useState<any>(null)

  const handleComparePlans = async () => {
    if (!selectedAccount) return

    setLoading(true)
    try {
      const account = accounts.find((a) => a.id === selectedAccount)
      const response = await fetch('/api/plan/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: selectedAccount,
          region: account?.region,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setComparisons(data.recommendations || [])
        setCurrentPlan(data.currentPlan)
      }
    } catch (error) {
      console.error('Error comparing plans:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Plan Comparison</h1>
          <p className="text-sm text-muted-foreground">Compare utility plans and find the best savings</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {accounts.length === 0 ? (
          <Card>
            <CardContent className="pt-6 pb-6 text-center">
              <p className="text-muted-foreground">Add an account first to compare plans</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Select Account</CardTitle>
                <CardDescription>Choose which account you want to analyze</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="text-sm font-medium block mb-2">Account</label>
                    <select
                      value={selectedAccount}
                      onChange={(e) => setSelectedAccount(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.provider || 'Unnamed'} - {account.region}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button onClick={handleComparePlans} disabled={loading}>
                    {loading ? 'Analyzing...' : 'Compare Plans'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {currentPlan && (
              <Card className="mb-6 border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle>Current Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{currentPlan.provider || 'Current Provider'}</p>
                      <p className="text-sm text-muted-foreground">Estimated Monthly Cost</p>
                    </div>
                    <p className="text-3xl font-bold">${currentPlan.estimatedMonthlyCost?.toFixed(2) || '0.00'}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {comparisons.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Recommended Plans</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {comparisons.map((plan, index) => (
                    <Card key={plan.planId} className={index === 0 ? 'border-green-300 bg-green-50' : ''}>
                      <CardHeader>
                        {index === 0 && (
                          <div className="mb-2">
                            <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">Best Savings</span>
                          </div>
                        )}
                        <CardTitle className="text-lg">{plan.planName}</CardTitle>
                        <CardDescription>{plan.provider}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground">Estimated Monthly Cost</p>
                          <p className="text-2xl font-bold">${plan.estimatedMonthlyCost.toFixed(2)}</p>
                        </div>
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground">Annual Savings</p>
                          <p className="text-2xl font-bold text-green-600">
                            ${plan.estimatedAnnualSavings.toFixed(2)}
                          </p>
                        </div>
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-muted-foreground mb-2">Features:</p>
                          <ul className="text-xs space-y-1">
                            {plan.features.map((feature, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="text-green-600">✓</span>
                                <span>{feature}</span>
                              </li>
                            ))}
                            <li className="flex items-start gap-1">
                              <span className="text-green-600">✓</span>
                              <span>{plan.planType} pricing</span>
                            </li>
                          </ul>
                        </div>
                        <Button className="w-full" variant={index === 0 ? 'default' : 'outline'}>
                          Switch to This Plan
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
