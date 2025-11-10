import { auth } from '@clerk/nextjs/server'
import { prisma } from './db'

export type UserRole = 'user' | 'admin'

export interface AuthUser {
  id: string
  clerkId: string
  email: string
  role: UserRole
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  })

  if (!user) {
    return null
  }

  return {
    id: user.id,
    clerkId: user.clerkId,
    email: user.email,
    role: user.role as UserRole,
  }
}

export function hasRole(user: AuthUser, role: UserRole): boolean {
  if (role === 'admin') {
    return user.role === 'admin'
  }
  return true // All authenticated users have 'user' role
}

export async function canAccessAccount(
  userId: string,
  accountId: string
): Promise<boolean> {
  const account = await prisma.utilityAccount.findFirst({
    where: {
      id: accountId,
      userId,
    },
  })

  return !!account
}
