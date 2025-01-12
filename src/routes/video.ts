import { Hono } from 'hono'
import { videoQueue } from '../config/redis'
import { upload } from '../middlewares/upload'
import { VideoProcessingOptions } from '../types'
import { MultipartUploadHandler } from '../services/multipartUpload'
import { nanoid } from 'nanoid'

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

router.post('/upload/chunk', async (c) => {
  const body = await c.req.parseBody()
  const { filename, totalChunks, currentChunk } = body
  const chunk = body.chunk as File
  const jobId = c.req.header('X-Job-Id') || nanoid()

  try {
    const buffer = Buffer.from(await chunk.arrayBuffer())
    const chunkPath = await MultipartUploadHandler.handleChunkedUpload(
      buffer,
      filename as string,
      parseInt(totalChunks as string),
      parseInt(currentChunk as string),
      jobId
    )

    return c.json({ jobId, chunkPath })
  } catch (error) {
    return c.json({ error: 'Upload failed' }, 500)
  }
})

export { router as videoRouter } 