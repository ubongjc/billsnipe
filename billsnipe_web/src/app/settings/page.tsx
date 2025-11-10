import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { SettingsClient } from './settings-client'

export default async function SettingsPage() {
  const { userId } = await auth()
  const clerkUser = await currentUser()

  if (!userId || !clerkUser) {
    redirect('/sign-in')
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      utilityAccounts: {
        select: { id: true },
      },
    },
  })

  if (!user) {
    redirect('/onboarding')
  }

  return (
    <SettingsClient
      user={{
        id: user.id,
        email: user.email,
        role: user.role,
        accountsCount: user.utilityAccounts.length,
        createdAt: user.createdAt.toISOString(),
      }}
      clerkUser={{
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
      }}
    />
  )
}
