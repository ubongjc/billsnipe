import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { prisma } from '@/lib/db'

type WebhookEvent = {
  type: string
  data: {
    id: string
    email_addresses?: Array<{ email_address: string }>
  }
}

export async function POST(req: NextRequest) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET to .env')
  }

  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: 'Missing svix headers' },
      { status: 400 }
    )
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return NextResponse.json(
      { error: 'Error verifying webhook' },
      { status: 400 }
    )
  }

  const eventType = evt.type

  if (eventType === 'user.created') {
    const { id, email_addresses } = evt.data
    const email = email_addresses?.[0]?.email_address

    if (email) {
      await prisma.user.create({
        data: {
          clerkId: id,
          email,
        },
      })
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data
    await prisma.user.delete({
      where: { clerkId: id },
    })
  }

  return NextResponse.json({ received: true })
}
