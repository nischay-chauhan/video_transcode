export interface VideoProcessingOptions {
  quality?: string | undefined
  format?: string | undefined
  resolution?: string | undefined
}

export interface VideoProcessingJob {
  inputPath: string
  outputPath: string
  options: VideoProcessingOptions
}

export interface UploadResponse {
  jobId: string
  status: string
}

// Add Express types if needed
declare global {
  namespace Express {
    interface Multer {
      File: {
        path: string
        filename: string
        // Add other properties as needed
      }
    }
  }
} 