import { Queue } from 'bullmq'
import Redis from 'ioredis'

export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
})

export const videoQueue = new Queue('video-processing', {
  connection: redis,
}) 