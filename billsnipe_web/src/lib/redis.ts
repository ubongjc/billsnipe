import Redis from 'ioredis'

const getRedisUrl = () => {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL
  }
  return 'redis://localhost:6379'
}

class RedisClient {
  private static instance: Redis | null = null

  static getInstance(): Redis {
    if (!RedisClient.instance) {
      RedisClient.instance = new Redis(getRedisUrl(), {
        maxRetriesPerRequest: 3,
        retryStrategy: (times: number) => {
          if (times > 3) {
            return null
          }
          return Math.min(times * 200, 1000)
        },
      })

      RedisClient.instance.on('error', (error) => {
        console.error('Redis connection error:', error)
      })

      RedisClient.instance.on('connect', () => {
        console.log('Redis connected successfully')
      })
    }

    return RedisClient.instance
  }

  static async disconnect(): Promise<void> {
    if (RedisClient.instance) {
      await RedisClient.instance.quit()
      RedisClient.instance = null
    }
  }
}

export const redis = RedisClient.getInstance()
export default redis
