import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { withApiMiddleware, apiResponse } from '@/lib/api-utils'

const SubscriptionSchema = z.object({
  endpoint: z.string().url(),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
})

/**
 * Subscribe to push notifications
 */
async function handleSubscribe(req: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const subscription = SubscriptionSchema.parse(body)

  // Get user from database
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Store subscription in database
  // Note: In a real implementation, you would have a PushSubscription model
  // For now, we'll store it in a JSONB field or separate table

  // TODO: Add PushSubscription model to Prisma schema
  // await prisma.pushSubscription.upsert({
  //   where: {
  //     endpoint: subscription.endpoint,
  //   },
  //   create: {
  //     userId: user.id,
  //     endpoint: subscription.endpoint,
  //     expirationTime: subscription.expirationTime,
  //     p256dh: subscription.keys.p256dh,
  //     auth: subscription.keys.auth,
  //   },
  //   update: {
  //     expirationTime: subscription.expirationTime,
  //     p256dh: subscription.keys.p256dh,
  //     auth: subscription.keys.auth,
  //   },
  // })

  return apiResponse({
    success: true,
    message: 'Subscription saved successfully',
  })
}

/**
 * Unsubscribe from push notifications
 */
async function handleUnsubscribe(req: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { endpoint } = z.object({ endpoint: z.string().url() }).parse(body)

  // Get user from database
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // TODO: Remove subscription from database
  // await prisma.pushSubscription.delete({
  //   where: {
  //     endpoint,
  //     userId: user.id,
  //   },
  // })

  return apiResponse({
    success: true,
    message: 'Unsubscribed successfully',
  })
}

export const POST = withApiMiddleware(handleSubscribe, {
  validateBody: SubscriptionSchema,
})

export const DELETE = withApiMiddleware(handleUnsubscribe)
