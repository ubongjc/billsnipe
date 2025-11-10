import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const SwitchRequestSchema = z.object({
  accountId: z.string().cuid(),
  planId: z.string().cuid(),
  consent: z.boolean(),
  notes: z.string().optional(),
})

/**
 * @swagger
 * /api/switch/request:
 *   post:
 *     summary: Request a plan switch
 *     description: Submit a request to switch utility plans
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
 *               - planId
 *               - consent
 *             properties:
 *               accountId:
 *                 type: string
 *                 description: The utility account ID
 *               planId:
 *                 type: string
 *                 description: The target plan ID
 *               consent:
 *                 type: boolean
 *                 description: User consent to proceed with switch
 *               notes:
 *                 type: string
 *                 description: Additional notes or preferences
 *     responses:
 *       200:
 *         description: Switch request created successfully
 *       400:
 *         description: Invalid request or missing consent
 *       403:
 *         description: Account access denied
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validated = SwitchRequestSchema.parse(body)

    // Require explicit consent
    if (!validated.consent) {
      return NextResponse.json(
        { error: 'User consent is required to proceed with plan switch' },
        { status: 400 }
      )
    }

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

    // Verify the plan exists and is active
    const plan = await prisma.planCatalog.findFirst({
      where: {
        id: validated.planId,
        active: true,
      },
    })

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found or inactive' },
        { status: 404 }
      )
    }

    // Check if there's already a pending request for this account
    const existingRequest = await prisma.switchAction.findFirst({
      where: {
        accountId: validated.accountId,
        status: 'pending',
      },
    })

    if (existingRequest) {
      return NextResponse.json(
        {
          error: 'A switch request is already pending for this account',
          existingRequestId: existingRequest.id,
        },
        { status: 409 }
      )
    }

    // Create the switch request
    const switchAction = await prisma.switchAction.create({
      data: {
        accountId: validated.accountId,
        planId: validated.planId,
        status: 'pending',
        notes: validated.notes,
      },
      include: {
        account: {
          select: {
            provider: true,
            region: true,
          },
        },
        plan: {
          select: {
            name: true,
            provider: true,
          },
        },
      },
    })

    // In production, this would trigger:
    // 1. Notification to user
    // 2. Background job to process the switch
    // 3. API calls to utility provider
    // 4. Verification and compliance checks

    return NextResponse.json({
      success: true,
      switchAction: {
        id: switchAction.id,
        accountId: switchAction.accountId,
        currentProvider: switchAction.account.provider,
        targetPlan: {
          id: switchAction.planId,
          name: switchAction.plan.name,
          provider: switchAction.plan.provider,
        },
        status: switchAction.status,
        requestedAt: switchAction.requestedAt.toISOString(),
        notes: switchAction.notes,
      },
      message:
        'Switch request created successfully. You will receive a notification once the switch is processed.',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating switch request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/switch/request:
 *   get:
 *     summary: Get switch requests
 *     description: Retrieve switch requests for user's accounts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: string
 *         description: Filter by account ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed, cancelled]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of switch requests
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const accountId = searchParams.get('accountId')
    const status = searchParams.get('status')

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

    // Build query
    const whereClause: any = {
      account: {
        userId: user.id,
      },
    }

    if (accountId) {
      // Verify account belongs to user
      const accountBelongsToUser = user.utilityAccounts.some(
        (acc) => acc.id === accountId
      )

      if (!accountBelongsToUser) {
        return NextResponse.json(
          { error: 'Account not found or access denied' },
          { status: 403 }
        )
      }

      whereClause.accountId = accountId
    }

    if (status) {
      whereClause.status = status
    }

    const switchActions = await prisma.switchAction.findMany({
      where: whereClause,
      include: {
        account: {
          select: {
            provider: true,
            region: true,
          },
        },
        plan: {
          select: {
            name: true,
            provider: true,
          },
        },
      },
      orderBy: {
        requestedAt: 'desc',
      },
    })

    return NextResponse.json({
      switchRequests: switchActions.map((action) => ({
        id: action.id,
        accountId: action.accountId,
        currentProvider: action.account.provider,
        targetPlan: {
          id: action.planId,
          name: action.plan.name,
          provider: action.plan.provider,
        },
        status: action.status,
        requestedAt: action.requestedAt.toISOString(),
        completedAt: action.completedAt?.toISOString(),
        notes: action.notes,
      })),
    })
  } catch (error) {
    console.error('Error fetching switch requests:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
