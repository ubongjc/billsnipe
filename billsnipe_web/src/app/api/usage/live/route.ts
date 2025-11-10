import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { withApiMiddleware, apiResponse, apiRateLimiter } from '@/lib/api-utils'

const LiveUsageRequestSchema = z.object({
  accountId: z.string().cuid(),
})

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

/**
 * Live usage monitoring endpoint
 * Provides real-time usage data and alerts
 */
async function handleLiveUsage(req: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = Object.fromEntries(req.nextUrl.searchParams)
  const validated = LiveUsageRequestSchema.parse(searchParams)

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

  // Get current hour usage
  const now = new Date()
  const currentHourStart = new Date(now)
  currentHourStart.setMinutes(0, 0, 0)

  const currentHourUsage = await prisma.usageHour.findFirst({
    where: {
      accountId: validated.accountId,
      timestamp: {
        gte: currentHourStart,
        lt: new Date(currentHourStart.getTime() + 60 * 60 * 1000),
      },
    },
  })

  // Get last 24 hours
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const last24Hours = await prisma.usageHour.findMany({
    where: {
      accountId: validated.accountId,
      timestamp: {
        gte: twentyFourHoursAgo,
      },
    },
    orderBy: {
      timestamp: 'asc',
    },
  })

  // Get today's total
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

  const todayUsage = await prisma.usageHour.findMany({
    where: {
      accountId: validated.accountId,
      timestamp: {
        gte: todayStart,
      },
    },
  })

  // Get yesterday's total
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(yesterdayStart.getDate() - 1)

  const yesterdayUsage = await prisma.usageHour.findMany({
    where: {
      accountId: validated.accountId,
      timestamp: {
        gte: yesterdayStart,
        lt: todayStart,
      },
    },
  })

  // Calculate metrics
  const baseRate = 0.15 // Base electricity rate

  const todayTotal = todayUsage.reduce((sum, u) => sum + u.kWh, 0)
  const yesterdayTotal = yesterdayUsage.reduce((sum, u) => sum + u.kWh, 0)
  const percentChange = yesterdayTotal > 0
    ? ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100
    : 0

  // Determine status based on current hour usage
  const currentKWh = currentHourUsage?.kWh || 0
  const avgHourlyUsage = todayTotal / Math.max(1, todayUsage.length)

  let status: 'normal' | 'high' | 'very_high'
  if (currentKWh > avgHourlyUsage * 1.5) {
    status = 'very_high'
  } else if (currentKWh > avgHourlyUsage * 1.2) {
    status = 'high'
  } else {
    status = 'normal'
  }

  const liveData: LiveUsageData = {
    currentHour: {
      timestamp: currentHourStart.toISOString(),
      kWh: currentKWh,
      cost: currentKWh * baseRate,
    },
    last24Hours: last24Hours.map((usage) => ({
      hour: usage.timestamp.getHours(),
      kWh: usage.kWh,
      cost: usage.kWh * baseRate,
    })),
    todayTotal: {
      kWh: todayTotal,
      cost: todayTotal * baseRate,
    },
    comparison: {
      yesterdayTotal,
      percentChange: Math.round(percentChange * 10) / 10,
    },
    status,
  }

  return apiResponse(liveData)
}

export const GET = withApiMiddleware(handleLiveUsage, {
  rateLimit: apiRateLimiter,
  validateQuery: LiveUsageRequestSchema,
})
