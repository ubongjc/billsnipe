import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { ReportsClient } from './reports-client'

export default async function ReportsPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      utilityAccounts: {
        include: {
          savingsReports: {
            orderBy: { month: 'desc' },
            take: 12,
          },
        },
      },
    },
  })

  if (!user) {
    redirect('/onboarding')
  }

  const allReports = user.utilityAccounts.flatMap((account) =>
    account.savingsReports.map((report) => ({
      ...report,
      month: report.month.toISOString(),
      accountProvider: account.provider,
    }))
  )

  allReports.sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime())

  return <ReportsClient reports={allReports} />
}
