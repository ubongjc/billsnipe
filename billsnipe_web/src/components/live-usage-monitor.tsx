'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface LiveUsageData {
  currentHour: {
    timestamp: string
    kWh: number
    cost: number
  }
  last24Hours: Array<{
    hour: number
    kWh: number
    cost: number
  }>
  todayTotal: {
    kWh: number
    cost: number
  }
  comparison: {
    yesterdayTotal: number
    percentChange: number
  }
  status: 'normal' | 'high' | 'very_high'
}

interface LiveUsageMonitorProps {
  accountId: string
  refreshInterval?: number
}

export function LiveUsageMonitor({ accountId, refreshInterval = 60000 }: LiveUsageMonitorProps) {
  const [data, setData] = useState<LiveUsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLiveData = async () => {
      try {
        const response = await fetch(`/api/usage/live?accountId=${accountId}`)

        if (!response.ok) {
          throw new Error('Failed to fetch live usage data')
        }

        const result = await response.json()
        setData(result)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    // Initial fetch
    fetchLiveData()

    // Set up polling
    const interval = setInterval(fetchLiveData, refreshInterval)

    return () => clearInterval(interval)
  }, [accountId, refreshInterval])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Live Usage</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-pulse">Loading live data...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Live Usage</CardTitle>
          <CardDescription>Error loading data</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error || 'No data available'}</p>
        </CardContent>
      </Card>
    )
  }

  const statusColors = {
    normal: 'text-green-600',
    high: 'text-yellow-600',
    very_high: 'text-red-600',
  }

  const statusLabels = {
    normal: 'Normal',
    high: 'High Usage',
    very_high: 'Very High Usage',
  }

  const statusBgColors = {
    normal: 'bg-green-50 border-green-200',
    high: 'bg-yellow-50 border-yellow-200',
    very_high: 'bg-red-50 border-red-200',
  }

  return (
    <Card className={statusBgColors[data.status]}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Live Usage Monitor</CardTitle>
            <CardDescription>Real-time energy consumption</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Hour */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="border rounded-lg p-4 bg-background">
            <p className="text-sm text-muted-foreground mb-1">Current Hour</p>
            <p className="text-2xl font-bold">{data.currentHour.kWh.toFixed(2)} kWh</p>
            <p className="text-xs text-muted-foreground">${data.currentHour.cost.toFixed(2)}</p>
          </div>

          <div className="border rounded-lg p-4 bg-background">
            <p className="text-sm text-muted-foreground mb-1">Today's Total</p>
            <p className="text-2xl font-bold">{data.todayTotal.kWh.toFixed(2)} kWh</p>
            <p className="text-xs text-muted-foreground">${data.todayTotal.cost.toFixed(2)}</p>
          </div>

          <div className="border rounded-lg p-4 bg-background">
            <p className="text-sm text-muted-foreground mb-1">Status</p>
            <p className={`text-2xl font-bold ${statusColors[data.status]}`}>
              {statusLabels[data.status]}
            </p>
            <p className="text-xs text-muted-foreground">
              {data.comparison.percentChange >= 0 ? '+' : ''}
              {data.comparison.percentChange.toFixed(1)}% vs yesterday
            </p>
          </div>
        </div>

        {/* 24-Hour Chart */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Last 24 Hours</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.last24Hours}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="hour"
                tickFormatter={(hour) => `${hour}:00`}
              />
              <YAxis />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(2)} kWh`, 'Usage']}
                labelFormatter={(hour) => `Hour: ${hour}:00`}
              />
              <Line
                type="monotone"
                dataKey="kWh"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Alerts */}
        {data.status !== 'normal' && (
          <div className={`p-3 rounded-lg border ${
            data.status === 'very_high'
              ? 'bg-red-50 border-red-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <p className="text-sm font-medium">
              {data.status === 'very_high' ? '⚠️ High Usage Alert' : '⚡ Elevated Usage'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.status === 'very_high'
                ? 'Your current usage is significantly higher than average. Consider reducing non-essential loads.'
                : 'Usage is slightly elevated. Monitor your consumption to avoid unexpected costs.'}
            </p>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Updates every minute • Last updated: {new Date().toLocaleTimeString()}
        </p>
      </CardContent>
    </Card>
  )
}
