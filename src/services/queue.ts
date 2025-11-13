import { Worker } from 'bullmq'
import { redis, videoQueue } from '../config/redis'
import { VideoProcessor } from './videoProcessor'
import { VideoProcessingJob } from '../types'

export const initializeWorker = () => {
  const worker = new Worker(
    'video-processing',
    async (job) => {
      const { inputPath, outputPath, options } = job.data as VideoProcessingJob

      if (!job.data || !job.id) {
        throw new Error('Invalid job data')
      }

      try {
        await VideoProcessor.processVideo(inputPath, outputPath, options, job.id)
        return { success: true, outputPath }
      } catch (error) {
        throw new Error(`Video processing failed: ${(error as Error).message || 'Unknown error'}`)
      }
    },
    { connection: redis }
  )

  worker.on('active', (job) => {
    console.log(`Job ${job.id} has started processing`)
  })
  
  worker.on('progress', (job, progress) => {
    console.log(`Job ${job.id} is ${progress}% complete`)
  })

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`)
  })

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err)
  })

  return worker
} 