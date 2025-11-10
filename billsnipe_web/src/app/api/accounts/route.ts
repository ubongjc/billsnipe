import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const CreateAccountSchema = z.object({
  region: z.string().min(1),
  provider: z.string().optional(),
  accountNumber: z.string().optional(),
})

/**
 * @swagger
 * /api/accounts:
 *   get:
 *     summary: Get user's utility accounts
 *     security:
 *       - bearerAuth: []
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        utilityAccounts: {
          include: {
            _count: {
              select: {
                usageHours: true,
                switchActions: true,
                savingsReports: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      accounts: user.utilityAccounts.map((account) => ({
        id: account.id,
        region: account.region,
        provider: account.provider,
        accountNumber: account.accountNumber,
        status: account.status,
        createdAt: account.createdAt.toISOString(),
        stats: {
          usageRecords: account._count.usageHours,
          switchActions: account._count.switchActions,
          savingsReports: account._count.savingsReports,
        },
      })),
    })
  } catch (error) {
    console.error('Error fetching accounts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * @swagger
 * /api/accounts:
 *   post:
 *     summary: Create a new utility account
 *     security:
 *       - bearerAuth: []
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validated = CreateAccountSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const account = await prisma.utilityAccount.create({
      data: {
        userId: user.id,
        region: validated.region,
        provider: validated.provider,
        accountNumber: validated.accountNumber,
        status: 'active',
      },
    })

    return NextResponse.json({
      success: true,
      account: {
        id: account.id,
        region: account.region,
        provider: account.provider,
        accountNumber: account.accountNumber,
        status: account.status,
        createdAt: account.createdAt.toISOString(),
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating account:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
