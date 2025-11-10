import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { applySecurityHeaders } from './lib/security-headers'

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/health(.*)',
  '/api/webhooks(.*)',
])

// Rate limiting will be applied at the API route level to avoid edge runtime issues
// This middleware handles authentication and security headers

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Apply security headers to all responses
  const response = NextResponse.next()

  // Add security headers
  const securedResponse = applySecurityHeaders(response)

  // Protect non-public routes
  if (!isPublicRoute(req)) {
    await auth.protect()
  }

  return securedResponse
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
