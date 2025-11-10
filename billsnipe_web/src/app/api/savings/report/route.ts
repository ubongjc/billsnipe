import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const SavingsQuerySchema = z.object({
  accountId: z.string().cuid().optional(),
  startMonth: z.string().optional(),
  endMonth: z.string().optional(),
  verified: z.enum(['true', 'false', 'all']).optional(),
})

/**
 * @swagger
 * /api/savings/report:
 *   get:
 *     summary: Get savings reports
 *     description: Retrieve savings reports for user's utility accounts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: string
 *         description: Filter by specific account ID
 *       - in: query
 *         name: startMonth
 *         schema:
 *           type: string
 *           format: date
 *         description: Start month for report range
 *       - in: query
 *         name: endMonth
 *         schema:
 *           type: string
 *           format: date
 *         description: End month for report range
 *       - in: query
 *         name: verified
 *         schema:
 *           type: string
 *           enum: [true, false, all]
 *         description: Filter by verification status
 *     responses:
 *       200:
 *         description: Savings reports
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reports:
 *                   type: array
 *                   items:
 *                     type: object
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalSavings:
 *                       type: number
 *                     averageMonthlySavings:
 *                       type: number
 *                     totalVerifiedSavings:
 *                       type: number
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url)
    const params = {
      accountId: searchParams.get('accountId') || undefined,
      startMonth: searchParams.get('startMonth') || undefined,
      endMonth: searchParams.get('endMonth') || undefined,
      verified: searchParams.get('verified') || 'all',
    }

    const validated = SavingsQuerySchema.parse(params)

    // Get the user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        utilityAccounts: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Build query filters
    const whereClause: any = {
      account: {
        userId: user.id,
      },
    }

    if (validated.accountId) {
      // Verify account belongs to user
      const accountBelongsToUser = user.utilityAccounts.some(
        (acc) => acc.id === validated.accountId
      )

      if (!accountBelongsToUser) {
        return NextResponse.json(
          { error: 'Account not found or access denied' },
          { status: 403 }
        )
      }

      whereClause.accountId = validated.accountId
    }

    if (validated.startMonth) {
      whereClause.month = {
        ...whereClause.month,
        gte: new Date(validated.startMonth),
      }
    }

    if (validated.endMonth) {
      whereClause.month = {
        ...whereClause.month,
        lte: new Date(validated.endMonth),
      }
    }

    if (validated.verified !== 'all') {
      whereClause.verified = validated.verified === 'true'
    }

    // Fetch savings reports
    const reports = await prisma.savingsReport.findMany({
      where: whereClause,
      include: {
        account: {
          select: {
            id: true,
            provider: true,
            region: true,
          },
        },
      },
      orderBy: {
        month: 'desc',
      },
    })

    // Calculate summary statistics
    const totalSavings = reports.reduce((sum, report) => sum + report.savings, 0)
    const verifiedReports = reports.filter((r) => r.verified)
    const totalVerifiedSavings = verifiedReports.reduce(
      (sum, report) => sum + report.savings,
      0
    )
    const averageMonthlySavings =
      reports.length > 0 ? totalSavings / reports.length : 0

    // Calculate monthly trends
    const monthlyData = reports.reduce((acc, report) => {
      const monthKey = report.month.toISOString().substring(0, 7)
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          savings: 0,
          baseline: 0,
          actual: 0,
          count: 0,
        }
      }
      acc[monthKey].savings += report.savings
      acc[monthKey].baseline += report.baseline
      acc[monthKey].actual += report.actual
      acc[monthKey].count += 1
      return acc
    }, {} as Record<string, any>)

    const trends = Object.values(monthlyData).sort((a: any, b: any) =>
      a.month.localeCompare(b.month)
    )

    return NextResponse.json({
      reports: reports.map((report) => ({
        id: report.id,
        accountId: report.accountId,
        account: report.account,
        month: report.month.toISOString(),
        baseline: report.baseline,
        actual: report.actual,
        savings: report.savings,
        savingsPercentage: ((report.savings / report.baseline) * 100).toFixed(2),
        verified: report.verified,
        createdAt: report.createdAt.toISOString(),
      })),
      summary: {
        totalReports: reports.length,
        totalSavings: parseFloat(totalSavings.toFixed(2)),
        totalVerifiedSavings: parseFloat(totalVerifiedSavings.toFixed(2)),
        averageMonthlySavings: parseFloat(averageMonthlySavings.toFixed(2)),
        verifiedReportsCount: verifiedReports.length,
      },
      trends,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error fetching savings reports:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/savings/report:
 *   post:
 *     summary: Create a savings report
 *     description: Generate a new savings report for an account
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
 *               - month
 *               - baseline
 *               - actual
 *             properties:
 *               accountId:
 *                 type: string
 *               month:
 *                 type: string
 *                 format: date
 *               baseline:
 *                 type: number
 *               actual:
 *                 type: number
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    const CreateReportSchema = z.object({
      accountId: z.string().cuid(),
      month: z.string().datetime(),
      baseline: z.number().positive(),
      actual: z.number().positive(),
    })

    const validated = CreateReportSchema.parse(body)

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

    // Calculate savings
    const savings = validated.baseline - validated.actual

    // Create savings report
    const report = await prisma.savingsReport.create({
      data: {
        accountId: validated.accountId,
        month: new Date(validated.month),
        baseline: validated.baseline,
        actual: validated.actual,
        savings,
        verified: false, // Will be verified later
      },
    })

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        accountId: report.accountId,
        month: report.month.toISOString(),
        baseline: report.baseline,
        actual: report.actual,
        savings: report.savings,
        verified: report.verified,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating savings report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
