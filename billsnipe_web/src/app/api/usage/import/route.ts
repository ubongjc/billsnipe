import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const UsageDataSchema = z.object({
  accountId: z.string().cuid(),
  data: z.array(
    z.object({
      timestamp: z.string().datetime(),
      kWh: z.number().positive(),
    })
  ),
})

/**
 * @swagger
 * /api/usage/import:
 *   post:
 *     summary: Import usage data
 *     description: Import hourly usage data for a utility account
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
 *               - data
 *             properties:
 *               accountId:
 *                 type: string
 *                 description: The utility account ID
 *               data:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - timestamp
 *                     - kWh
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       description: The timestamp for the usage reading
 *                     kWh:
 *                       type: number
 *                       description: Energy usage in kilowatt-hours
 *     responses:
 *       200:
 *         description: Usage data imported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 imported:
 *                   type: integer
 *                   description: Number of records imported
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - account does not belong to user
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validated = UsageDataSchema.parse(body)

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

    // Import the usage data
    const usageRecords = validated.data.map((record) => ({
      accountId: validated.accountId,
      timestamp: new Date(record.timestamp),
      kWh: record.kWh,
    }))

    await prisma.usageHour.createMany({
      data: usageRecords,
      skipDuplicates: true,
    })

    return NextResponse.json({
      success: true,
      imported: usageRecords.length,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error importing usage data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
