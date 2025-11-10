import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // Fetch user data
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      utilityAccounts: {
        include: {
          savingsReports: {
            orderBy: { month: 'desc' },
            take: 6,
          },
          switchActions: {
            where: { status: 'pending' },
          },
        },
      },
    },
  })

  if (!user) {
    redirect('/onboarding')
  }

  // Calculate total savings
  const totalSavings = user.utilityAccounts.reduce((acc, account) => {
    return (
      acc +
      account.savingsReports.reduce((sum, report) => sum + report.savings, 0)
    )
  }, 0)

  // Get recent activity
  const recentReports = user.utilityAccounts.flatMap((account) =>
    account.savingsReports.map((report) => ({
      ...report,
      account: {
        provider: account.provider,
        region: account.region,
      },
    }))
  )

  recentReports.sort(
    (a, b) => b.month.getTime() - a.month.getTime()
  )

  return (
    <DashboardClient
      user={{
        id: user.id,
        email: user.email,
        role: user.role,
      }}
      accounts={user.utilityAccounts.map((account) => ({
        id: account.id,
        provider: account.provider,
        region: account.region,
        status: account.status,
        pendingSwitches: account.switchActions.length,
      }))}
      totalSavings={totalSavings}
      recentReports={recentReports.slice(0, 5).map((report) => ({
        id: report.id,
        month: report.month.toISOString(),
        savings: report.savings,
        baseline: report.baseline,
        actual: report.actual,
        verified: report.verified,
        provider: report.account.provider,
      }))}
    />
  )
}
