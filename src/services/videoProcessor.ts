import ffmpeg from 'fluent-ffmpeg'
import { VideoProcessingOptions } from '../types'
import { join, dirname } from 'path'
import { rm as rmPromise } from 'fs/promises'
import { wsServer } from './wsServer'
import { Readable, Writable } from 'stream'
import { promisify } from 'util'
import fs from 'fs'

interface FFprobeMetadata {
  format: {
    duration: number;
    // Add other format properties as needed
  };
  // Add other top-level properties as needed
}

export class VideoProcessor {
  static async processVideo(
    inputPath: string,
    outputPath: string,
    options: VideoProcessingOptions,
    jobId: string
  ): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        // Create temporary directory for chunks
        const tempDir = join(outputPath, '..', '.chunks')
        await fs.promises.mkdir(tempDir, { recursive: true })

        // Get video duration
        const metadata = await promisify(ffmpeg.ffprobe)(inputPath) as FFprobeMetadata
        const duration = metadata.format.duration
        const chunkDuration = 30 // seconds per chunk
        const totalChunks = Math.ceil(duration / chunkDuration)

        // Process video in chunks
        for (let i = 0; i < totalChunks; i++) {
          const startTime = i * chunkDuration
          const endTime = Math.min((i + 1) * chunkDuration, duration)
          const chunkPath = join(tempDir, `chunk_${i}.mp4`)

          const command = ffmpeg(inputPath)
            .setStartTime(startTime)
            .setDuration(endTime - startTime)
            .output(chunkPath)

          // Add encoding options
          if (options.encoding) {
            if (options.encoding.preset) {
              command.addOption('-preset', options.encoding.preset)
            }
            if (options.encoding.crf) {
              command.addOption('-crf', options.encoding.crf.toString())
            }
            if (options.encoding.tune) {
              command.addOption('-tune', options.encoding.tune)
            }
          }

          // Add hardware acceleration
          if (options.hwaccel) {
            command.addOption('-hwaccel', options.hwaccel)
          }

          // Add advanced filters
          if (options.advancedFilters) {
            const filters: string[] = []
            if (options.advancedFilters.deinterlace) {
              filters.push('yadif')
            }
            if (options.advancedFilters.denoise) {
              filters.push('nlmeans')
            }
            if (options.advancedFilters.stabilize) {
              filters.push('deshake')
            }
            if (filters.length > 0) {
              command.videoFilters(filters)
            }
          }

          // Process chunk
          await promisify(command.run)()
          
          // Send progress update
          wsServer.broadcast({
            type: 'progress',
            jobId,
            data: { progress: (i + 1) / totalChunks * 100 }
          })
        }

        // Merge chunks using streams
        const writeStream = fs.createWriteStream(outputPath)
        const chunks = Array.from({ length: totalChunks }, (_, i) => 
          fs.createReadStream(join(tempDir, `chunk_${i}.mp4`))
        )

        // Create a pipeline to merge chunks
        const mergedStream = Readable.from(chunks)
        mergedStream.pipe(writeStream)
        await new Promise((resolve, reject) => {
          writeStream.on('finish', resolve)
          writeStream.on('error', reject)
        })

        // Cleanup temporary files
        await rmPromise(tempDir, { recursive: true, force: true })

        resolve(outputPath)
      } catch (error) {
        // Cleanup on error
        const tempDir = join(outputPath, '..', '.chunks')
        try {
          await rmPromise(tempDir, { recursive: true, force: true })
        } catch (cleanupError) {
          console.error('Error cleaning up temporary files:', cleanupError)
        }
        reject(error)
      }
    })
  }

  /**
   * Cleanup all temporary files associated with a job
   */
  static async cleanupJob(jobId: string, outputPath: string): Promise<void> {
    try {
      const tempDir = join(outputPath, '..', '.chunks')
      await rmPromise(tempDir, { recursive: true, force: true })
    } catch (error) {
      console.error(`Error cleaning up job ${jobId}:`, error)
    }
  }

  /**
   * Cleanup old temporary files older than 24 hours
   */
  static async cleanupOldFiles(): Promise<void> {
    try {
      const tempDir = join(process.cwd(), '.temp')
      const files = await fs.promises.readdir(tempDir)
      
      for (const file of files) {
        const filePath = join(tempDir, file)
        const stats = await fs.promises.stat(filePath)
        
        // Delete files older than 24 hours
        if (Date.now() - stats.mtimeMs > 24 * 60 * 60 * 1000) {
          await rmPromise(filePath, { recursive: true, force: true })
          console.log(`Cleaned up old file: ${file}`)
        }
      }
    } catch (error) {
      console.error('Error during cleanup:', error)
    }
  }
}