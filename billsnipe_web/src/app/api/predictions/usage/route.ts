import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { withApiMiddleware, apiResponse, heavyRateLimiter } from '@/lib/api-utils'

const PredictionRequestSchema = z.object({
  accountId: z.string().cuid(),
  predictionDays: z.number().min(1).max(90).default(30),
})

interface UsagePrediction {
  date: string
  predictedKWh: number
  confidence: number
  trend: 'increasing' | 'decreasing' | 'stable'
  estimatedCost: number
}

interface PredictionAnalytics {
  averageDailyUsage: number
  peakUsageHour: number
  lowestUsageHour: number
  weekdayAverage: number
  weekendAverage: number
  monthlyTrend: number
}

/**
 * AI-powered usage prediction endpoint
 * Analyzes historical patterns and predicts future usage
 */
async function handlePrediction(req: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const validated = PredictionRequestSchema.parse(body)

  // Get user from database
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Verify account ownership
  const account = await prisma.utilityAccount.findFirst({
    where: {
      id: validated.accountId,
      userId: user.id,
    },
  })

  if (!account) {
    return NextResponse.json(
      { error: 'Account not found or access denied' },
      { status: 403 }
    )
  }

  // Get historical usage data (last 90 days for better predictions)
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  const usageData = await prisma.usageHour.findMany({
    where: {
      accountId: validated.accountId,
      timestamp: {
        gte: ninetyDaysAgo,
      },
    },
    orderBy: {
      timestamp: 'asc',
    },
  })

  if (usageData.length < 168) {
    // Need at least 7 days of data
    return NextResponse.json(
      {
        error: 'Insufficient data',
        message: 'At least 7 days of usage data required for predictions',
      },
      { status: 400 }
    )
  }

  // Perform analytics and predictions
  const analytics = calculateAnalytics(usageData)
  const predictions = generatePredictions(usageData, validated.predictionDays, analytics)
  const insights = generateInsights(analytics, predictions)

  return apiResponse({
    accountId: validated.accountId,
    predictions,
    analytics,
    insights,
    dataQuality: {
      dataPoints: usageData.length,
      dateRange: {
        start: usageData[0].timestamp,
        end: usageData[usageData.length - 1].timestamp,
      },
      completeness: Math.min(100, (usageData.length / (90 * 24)) * 100),
    },
  })
}

function calculateAnalytics(
  usageData: Array<{ timestamp: Date; kWh: number }>
): PredictionAnalytics {
  // Calculate daily usage
  const dailyUsage = new Map<string, number>()
  const hourlyUsage = new Map<number, number[]>()
  const weekdayUsage: number[] = []
  const weekendUsage: number[] = []

  for (const usage of usageData) {
    const date = usage.timestamp.toISOString().split('T')[0]
    const hour = usage.timestamp.getHours()
    const isWeekend = [0, 6].includes(usage.timestamp.getDay())

    dailyUsage.set(date, (dailyUsage.get(date) || 0) + usage.kWh)

    if (!hourlyUsage.has(hour)) {
      hourlyUsage.set(hour, [])
    }
    hourlyUsage.get(hour)!.push(usage.kWh)

    if (isWeekend) {
      weekendUsage.push(usage.kWh)
    } else {
      weekdayUsage.push(usage.kWh)
    }
  }

  // Calculate averages
  const dailyValues = Array.from(dailyUsage.values())
  const averageDailyUsage = dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length

  // Find peak and lowest usage hours
  const hourlyAverages = Array.from(hourlyUsage.entries()).map(([hour, values]) => ({
    hour,
    average: values.reduce((a, b) => a + b, 0) / values.length,
  }))
  hourlyAverages.sort((a, b) => b.average - a.average)

  const peakUsageHour = hourlyAverages[0].hour
  const lowestUsageHour = hourlyAverages[hourlyAverages.length - 1].hour

  const weekdayAverage = weekdayUsage.reduce((a, b) => a + b, 0) / weekdayUsage.length
  const weekendAverage = weekendUsage.reduce((a, b) => a + b, 0) / weekendUsage.length

  // Calculate monthly trend using linear regression
  const monthlyTrend = calculateTrend(dailyValues)

  return {
    averageDailyUsage,
    peakUsageHour,
    lowestUsageHour,
    weekdayAverage,
    weekendAverage,
    monthlyTrend,
  }
}

function calculateTrend(values: number[]): number {
  // Simple linear regression
  const n = values.length
  const x = Array.from({ length: n }, (_, i) => i)
  const y = values

  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)

  return slope
}

function generatePredictions(
  usageData: Array<{ timestamp: Date; kWh: number }>,
  days: number,
  analytics: PredictionAnalytics
): UsagePrediction[] {
  const predictions: UsagePrediction[] = []
  const lastDate = new Date(usageData[usageData.length - 1].timestamp)
  const baseRate = 0.15 // Average electricity rate

  // Group usage by day of week for pattern detection
  const dayOfWeekPatterns = new Map<number, number[]>()
  const dailyUsage = new Map<string, number>()

  for (const usage of usageData) {
    const dayOfWeek = usage.timestamp.getDay()
    const date = usage.timestamp.toISOString().split('T')[0]

    if (!dayOfWeekPatterns.has(dayOfWeek)) {
      dayOfWeekPatterns.set(dayOfWeek, [])
    }

    dailyUsage.set(date, (dailyUsage.get(date) || 0) + usage.kWh)
  }

  // Calculate average for each day of week
  for (const [date, total] of dailyUsage.entries()) {
    const dayOfWeek = new Date(date).getDay()
    dayOfWeekPatterns.get(dayOfWeek)!.push(total)
  }

  const dayOfWeekAverages = new Map<number, number>()
  for (const [day, values] of dayOfWeekPatterns.entries()) {
    const avg = values.reduce((a, b) => a + b, 0) / values.length
    dayOfWeekAverages.set(day, avg)
  }

  // Generate predictions for each day
  for (let i = 1; i <= days; i++) {
    const predictionDate = new Date(lastDate)
    predictionDate.setDate(predictionDate.getDate() + i)

    const dayOfWeek = predictionDate.getDay()
    const baseUsage = dayOfWeekAverages.get(dayOfWeek) || analytics.averageDailyUsage

    // Apply trend
    const trendAdjustment = analytics.monthlyTrend * i
    const predictedKWh = Math.max(0, baseUsage + trendAdjustment)

    // Calculate confidence (decreases with prediction distance)
    const confidence = Math.max(0.5, 1 - (i / days) * 0.3)

    // Determine trend
    let trend: 'increasing' | 'decreasing' | 'stable'
    if (analytics.monthlyTrend > 0.1) {
      trend = 'increasing'
    } else if (analytics.monthlyTrend < -0.1) {
      trend = 'decreasing'
    } else {
      trend = 'stable'
    }

    predictions.push({
      date: predictionDate.toISOString().split('T')[0],
      predictedKWh: Math.round(predictedKWh * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      trend,
      estimatedCost: Math.round(predictedKWh * baseRate * 100) / 100,
    })
  }

  return predictions
}

function generateInsights(
  analytics: PredictionAnalytics,
  predictions: UsagePrediction[]
): string[] {
  const insights: string[] = []

  // Usage pattern insights
  if (analytics.weekendAverage > analytics.weekdayAverage * 1.2) {
    insights.push(
      `Your weekend usage is ${Math.round(
        ((analytics.weekendAverage / analytics.weekdayAverage - 1) * 100)
      )}% higher than weekdays. Consider time-of-use plans.`
    )
  }

  // Peak hour insights
  if (analytics.peakUsageHour >= 17 && analytics.peakUsageHour <= 21) {
    insights.push(
      `Peak usage occurs at ${analytics.peakUsageHour}:00 during evening hours. Shifting some activities could reduce costs.`
    )
  }

  // Trend insights
  const avgPredicted = predictions.reduce((sum, p) => sum + p.predictedKWh, 0) / predictions.length
  const trendChange = ((avgPredicted / analytics.averageDailyUsage - 1) * 100)

  if (Math.abs(trendChange) > 5) {
    if (trendChange > 0) {
      insights.push(
        `Usage is trending upward by ${Math.abs(trendChange).toFixed(1)}%. Monitor for efficiency opportunities.`
      )
    } else {
      insights.push(
        `Great news! Usage is trending downward by ${Math.abs(trendChange).toFixed(1)}%. Keep up the good work!`
      )
    }
  }

  // Cost projection
  const totalPredictedCost = predictions.reduce((sum, p) => sum + p.estimatedCost, 0)
  insights.push(
    `Estimated ${predictions.length}-day cost: $${totalPredictedCost.toFixed(2)} based on current patterns.`
  )

  return insights
}

export const POST = withApiMiddleware(handlePrediction, {
  rateLimit: heavyRateLimiter,
  validateBody: PredictionRequestSchema,
})
