import { Hono } from 'hono'
import { upload } from '../middlewares/upload'
import { uploadVideo, getJobStatus, uploadChunk } from '../controllers/videoController'

const router = new Hono()

// Video upload and processing routes
const videoRoutes = router
  .post('/upload', upload(), uploadVideo)
  .get('/status/:jobId', getJobStatus)
  .post('/upload/chunk', uploadChunk)

export { videoRoutes as videoRouter } 