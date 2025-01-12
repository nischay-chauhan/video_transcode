import ffmpeg from 'fluent-ffmpeg'
import { VideoProcessingOptions } from '../types'
import { join } from 'path'
import { wsServer } from './wsServer'

export class VideoProcessor {
  static async processVideo(
    inputPath: string,
    outputPath: string,
    options: VideoProcessingOptions,
    jobId: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      let command = ffmpeg(inputPath)

      // Advanced encoding options
      if (options.encoding) {
        if (options.encoding.preset) {
          command = command.addOption('-preset', options.encoding.preset)
        }
        if (options.encoding.crf) {
          command = command.addOption('-crf', options.encoding.crf.toString())
        }
        if (options.encoding.tune) {
          command = command.addOption('-tune', options.encoding.tune)
        }
      }

      // Hardware acceleration
      if (options.hwaccel) {
        command = command.addOption('-hwaccel', options.hwaccel)
      }

      // Advanced filters
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
          command = command.videoFilters(filters)
        }
      }

      // Progress tracking
      command.on('progress', (progress) => {
        wsServer.broadcast({
          type: 'progress',
          jobId,
          data: {
            percent: progress.percent,
            fps: progress.currentFps,
            time: progress.timemark
          }
        })
      })

      command
        .on('end', () => {
          wsServer.broadcast({
            type: 'status',
            jobId,
            data: { status: 'completed' }
          })
          resolve(outputPath)
        })
        .on('error', (err) => {
          wsServer.broadcast({
            type: 'error',
            jobId,
            data: { error: err.message }
          })
          reject(err)
        })
        .save(outputPath)
    })
  }
} 