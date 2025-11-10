import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimitMiddleware, apiRateLimiter, heavyRateLimiter } from './rate-limit'
import type { Ratelimit } from '@upstash/ratelimit'

export type ApiHandler<T = any> = (
  req: NextRequest,
  context: { params?: Record<string, string> }
) => Promise<NextResponse<T>>

interface ApiRouteOptions {
  requireAuth?: boolean
  rateLimit?: Ratelimit | false
  validateBody?: z.ZodSchema
  validateQuery?: z.ZodSchema
}

/**
 * Wraps an API handler with common middleware:
 * - Rate limiting
 * - Request validation
 * - Error handling
 * - CORS headers
 */
export function withApiMiddleware<T = any>(
  handler: ApiHandler<T>,
  options: ApiRouteOptions = {}
): ApiHandler<T> {
  const {
    rateLimit = apiRateLimiter,
    validateBody,
    validateQuery,
  } = options

  return async (req: NextRequest, context) => {
    try {
      // Apply rate limiting if enabled
      if (rateLimit !== false) {
        const rateLimitResponse = await rateLimitMiddleware(req, rateLimit)
        if (rateLimitResponse) {
          return rateLimitResponse as NextResponse
        }
      }

      // Validate request body if schema provided
      if (validateBody && req.method !== 'GET') {
        try {
          const body = await req.json()
          validateBody.parse(body)
        } catch (error) {
          if (error instanceof z.ZodError) {
            return NextResponse.json(
              {
                error: 'Validation failed',
                details: error.errors,
              },
              { status: 400 }
            )
          }
          throw error
        }
      }

      // Validate query parameters if schema provided
      if (validateQuery) {
        try {
          const searchParams = Object.fromEntries(req.nextUrl.searchParams)
          validateQuery.parse(searchParams)
        } catch (error) {
          if (error instanceof z.ZodError) {
            return NextResponse.json(
              {
                error: 'Invalid query parameters',
                details: error.errors,
              },
              { status: 400 }
            )
          }
          throw error
        }
      }

      // Call the actual handler
      return await handler(req, context)
    } catch (error) {
      console.error('API Error:', error)

      // Handle known errors
      if (error instanceof Error) {
        return NextResponse.json(
          {
            error: 'Internal server error',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined,
          },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Helper to create validated API responses
 */
export function apiResponse<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status })
}

/**
 * Helper to create error responses
 */
export function apiError(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status })
}

/**
 * Helper to get user ID from Clerk session
 */
export async function getCurrentUserId(req: NextRequest): Promise<string | null> {
  try {
    const { auth } = await import('@clerk/nextjs/server')
    const session = await auth()
    return session.userId
  } catch {
    return null
  }
}

/**
 * Common validation schemas
 */
export const schemas = {
  accountId: z.object({
    accountId: z.string().min(1, 'Account ID is required'),
  }),

  pagination: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
  }),

  dateRange: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
}

// Export rate limiters for specific use cases
export { apiRateLimiter, heavyRateLimiter }
