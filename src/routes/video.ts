import { Hono } from 'hono'
import { videoQueue } from '../config/redis'
import { upload } from '../middlewares/upload'
import { VideoProcessingOptions } from '../types'

// Simplified file interface
interface UploadedFile {
  path: string
  filename: string
}

declare module 'hono' {
  interface HonoRequest {
    file?: UploadedFile
  }
}

const router = new Hono()

router.post('/upload', upload(), async (c) => {
  const file = c.req.file
  const { quality, format, resolution } = c.req.query()
  
  const options: VideoProcessingOptions = {
    quality,
    format,
    resolution
  }

  if (!file) {
    return c.json({ error: 'No file uploaded' }, 400)
  }

  const jobId = await videoQueue.add('process-video', {
    inputPath: file.path,
    outputPath: `processed_${file.filename}`,
    options
  })

  return c.json({
    jobId: jobId.id,
    status: 'processing'
  })
})

router.get('/status/:jobId', async (c) => {
  const jobId = c.req.param('jobId')
  const job = await videoQueue.getJob(jobId)

  if (!job) {
    return c.json({ error: 'Job not found' }, 404)
  }

  const state = await job.getState()
  return c.json({ jobId, status: state })
})

export { router as videoRouter } 