import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import redis from './redis'

// Create Upstash-compatible Redis wrapper
class UpstashRedisWrapper {
  constructor(private client: typeof redis) {}

  async get(key: string): Promise<string | null> {
    return this.client.get(key)
  }

  async set(key: string, value: string, options?: { ex?: number }): Promise<'OK'> {
    if (options?.ex) {
      await this.client.setex(key, options.ex, value)
    } else {
      await this.client.set(key, value)
    }
    return 'OK'
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key)
  }

  async expire(key: string, seconds: number): Promise<number> {
    return this.client.expire(key, seconds)
  }

  async eval(script: string, keys: string[], args: string[]): Promise<any> {
    return this.client.eval(script, keys.length, ...keys, ...args)
  }
}

// Wrap ioredis client for Upstash compatibility
const upstashRedis = new UpstashRedisWrapper(redis) as unknown as Redis

// API rate limiter - 10 requests per 10 seconds
export const apiRateLimiter = new Ratelimit({
  redis: upstashRedis,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  prefix: 'ratelimit:api',
  analytics: true,
})

// Auth rate limiter - 5 requests per minute (more restrictive)
export const authRateLimiter = new Ratelimit({
  redis: upstashRedis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  prefix: 'ratelimit:auth',
  analytics: true,
})

// Heavy operations - 3 requests per minute
export const heavyRateLimiter = new Ratelimit({
  redis: upstashRedis,
  limiter: Ratelimit.slidingWindow(3, '1 m'),
  prefix: 'ratelimit:heavy',
  analytics: true,
})

// Export helper function for applying rate limits
export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit = apiRateLimiter
): Promise<{
  success: boolean
  limit: number
  remaining: number
  reset: number
}> {
  const { success, limit, remaining, reset } = await limiter.limit(identifier)

  return {
    success,
    limit,
    remaining,
    reset,
  }
}

// Middleware helper for API routes
export async function rateLimitMiddleware(
  request: Request,
  limiter: Ratelimit = apiRateLimiter
): Promise<Response | null> {
  // Get identifier from IP or user ID
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0] ?? '127.0.0.1'

  const identifier = request.headers.get('x-user-id') ?? ip

  const { success, limit, remaining, reset } = await checkRateLimit(identifier, limiter)

  // Add rate limit headers to response
  const headers = {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': new Date(reset).toISOString(),
  }

  if (!success) {
    return new Response(
      JSON.stringify({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        reset: new Date(reset).toISOString(),
      }),
      {
        status: 429,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    )
  }

  return null
}
