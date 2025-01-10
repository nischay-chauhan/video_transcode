export interface VideoProcessingOptions {
  quality?: string
  format?: string
  resolution?: string
  
  // Advanced video options
  fps?: number
  audioCodec?: string
  videoCodec?: string
  thumbnail?: boolean
  
  // Watermark configuration
  watermark?: {
    path?: string
    position: 'center' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'
    opacity?: number
  }
  
  // Video trimming
  trim?: {
    start?: string    // Format: "HH:mm:ss"
    duration?: string // Format: "HH:mm:ss"
  }
  
  // Video filters
  filters?: {
    brightness?: number  // Range: -1.0 to 1.0
    contrast?: number    // Range: -2.0 to 2.0
    saturation?: number  // Range: 0 to 3.0
    blur?: number        // Range: 0 to 10
    sharpen?: number     // Range: 0 to 10
    noise?: number       // Range: 0 to 100
  }
  
  // Audio options
  audio?: {
    volume?: number      // Range: 0 to 2.0
    fadeIn?: string      // Duration format: "HH:mm:ss"
    fadeOut?: string     // Duration format: "HH:mm:ss"
    bitrate?: string     // Example: "128k"
    channels?: number    // 1 for mono, 2 for stereo
  }
  
  output?: {
    preset?: 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow' | 'slower' | 'veryslow'
    metadata?: Record<string, string>
  }
}

export interface VideoProcessingJob {
  inputPath: string
  outputPath: string
  options: VideoProcessingOptions
}

export interface UploadResponse {
  jobId: string
  status: string
  thumbnailPath?: string
  metadata?: {
    duration?: string
    size?: number
    format?: string
    bitrate?: string
  }
}

export interface ProcessingProgress {
  jobId: string
  progress: number
  timeRemaining?: number
  currentFps?: number
}
