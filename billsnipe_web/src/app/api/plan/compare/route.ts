import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { withApiMiddleware, apiResponse, heavyRateLimiter } from '@/lib/api-utils'

const CompareRequestSchema = z.object({
  accountId: z.string().cuid(),
  region: z.string(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

interface PlanComparison {
  planId: string
  planName: string
  provider: string
  estimatedMonthlyCost: number
  estimatedAnnualCost: number
  estimatedAnnualSavings: number
  planType: string
  features: string[]
}

/**
 * @swagger
 * /api/plan/compare:
 *   post:
 *     summary: Compare utility plans
 *     description: Compare available utility plans based on usage history
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountId
 *               - region
 *             properties:
 *               accountId:
 *                 type: string
 *                 description: The utility account ID
 *               region:
 *                 type: string
 *                 description: The region to search for plans
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Start date for usage analysis
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: End date for usage analysis
 *     responses:
 *       200:
 *         description: Plan comparison results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 currentPlan:
 *                   type: object
 *                   description: Current plan details
 *                 recommendations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       planId:
 *                         type: string
 *                       planName:
 *                         type: string
 *                       provider:
 *                         type: string
 *                       estimatedMonthlyCost:
 *                         type: number
 *                       estimatedAnnualSavings:
 *                         type: number
 */
async function handleCompare(req: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const validated = CompareRequestSchema.parse(body)

    // Get the user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify the account belongs to the user
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

    // Get usage data for the specified period
    const startDate = validated.startDate
      ? new Date(validated.startDate)
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days

    const endDate = validated.endDate ? new Date(validated.endDate) : new Date()

    const usageData = await prisma.usageHour.findMany({
      where: {
        accountId: validated.accountId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
    })

    // Get available plans in the region
    const availablePlans = await prisma.planCatalog.findMany({
      where: {
        region: validated.region,
        active: true,
      },
    })

    // Calculate costs for each plan based on usage
    const comparisons: PlanComparison[] = availablePlans.map((plan) => {
      const estimatedCost = calculatePlanCost(plan, usageData)
      const currentCost = account.provider
        ? calculateCurrentCost(usageData)
        : estimatedCost

      return {
        planId: plan.id,
        planName: plan.name,
        provider: plan.provider,
        estimatedMonthlyCost: estimatedCost / 3, // Assuming 3-month period
        estimatedAnnualCost: (estimatedCost / 3) * 12,
        estimatedAnnualSavings: Math.max(0, (currentCost - estimatedCost) * 4),
        planType: getPlanType(plan.schema),
        features: getPlanFeatures(plan.schema),
      }
    })

    // Sort by savings (highest first)
    comparisons.sort((a, b) => b.estimatedAnnualSavings - a.estimatedAnnualSavings)

    return apiResponse({
      currentPlan: {
        provider: account.provider,
        estimatedMonthlyCost: calculateCurrentCost(usageData) / 3,
      },
      recommendations: comparisons.slice(0, 5), // Top 5 recommendations
      analysisPeriod: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalUsage: usageData.reduce((sum, u) => sum + u.kWh, 0),
      },
    })
}

// Export wrapped handler with rate limiting and validation
export const POST = withApiMiddleware(handleCompare, {
  rateLimit: heavyRateLimiter,
  validateBody: CompareRequestSchema,
})

// Helper function to calculate plan cost based on usage
function calculatePlanCost(
  plan: { schema: any },
  usageData: Array<{ timestamp: Date; kWh: number }>
): number {
  const schema = plan.schema as any

  // Simple calculation - in production, this would be much more complex
  // depending on plan type (TOU, tiered, flat rate, etc.)
  
  const totalKwh = usageData.reduce((sum, u) => sum + u.kWh, 0)
  const baseRate = schema.baseRate || 0.12 // Default rate per kWh
  
  if (schema.type === 'tiered') {
    return calculateTieredCost(totalKwh, schema.tiers)
  } else if (schema.type === 'tou') {
    return calculateTOUCost(usageData, schema.periods)
  } else {
    return totalKwh * baseRate
  }
}

function calculateTieredCost(totalKwh: number, tiers: any[]): number {
  let cost = 0
  let remainingKwh = totalKwh

  for (const tier of tiers || []) {
    const tierKwh = Math.min(remainingKwh, tier.limit || Infinity)
    cost += tierKwh * tier.rate
    remainingKwh -= tierKwh
    if (remainingKwh <= 0) break
  }

  return cost
}

function calculateTOUCost(
  usageData: Array<{ timestamp: Date; kWh: number }>,
  periods: any
): number {
  let cost = 0

  for (const usage of usageData) {
    const hour = usage.timestamp.getHours()
    let rate = periods.offPeak || 0.08

    if (hour >= 7 && hour < 11) {
      rate = periods.onPeak || 0.18
    } else if (hour >= 11 && hour < 17) {
      rate = periods.midPeak || 0.13
    } else if (hour >= 17 && hour < 19) {
      rate = periods.onPeak || 0.18
    }

    cost += usage.kWh * rate
  }

  return cost
}

function calculateCurrentCost(
  usageData: Array<{ timestamp: Date; kWh: number }>
): number {
  // Simple current cost calculation
  const totalKwh = usageData.reduce((sum, u) => sum + u.kWh, 0)
  return totalKwh * 0.15 // Average rate
}

function getPlanType(schema: any): string {
  return schema.type || 'fixed'
}

function getPlanFeatures(schema: any): string[] {
  const features: string[] = []

  if (schema.type === 'tou') {
    features.push('Time-of-Use pricing')
  }
  if (schema.type === 'tiered') {
    features.push('Tiered pricing')
  }
  if (schema.greenEnergy) {
    features.push('100% Green Energy')
  }
  if (schema.rewards) {
    features.push('Rewards program')
  }

  return features
}
