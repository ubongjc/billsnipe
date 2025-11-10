import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { AccountsClient } from './accounts-client'

export default async function AccountsPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
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
    redirect('/onboarding')
  }

  return (
    <AccountsClient
      accounts={user.utilityAccounts.map((account) => ({
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
      }))}
    />
  )
}
