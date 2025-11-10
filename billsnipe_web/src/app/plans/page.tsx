import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { PlansClient } from './plans-client'

export default async function PlansPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      utilityAccounts: {
        where: { status: 'active' },
        select: {
          id: true,
          provider: true,
          region: true,
        },
      },
    },
  })

  if (!user) {
    redirect('/onboarding')
  }

  return (
    <PlansClient
      accounts={user.utilityAccounts}
    />
  )
}
