import ffmpeg from 'fluent-ffmpeg'
import { VideoProcessingOptions } from '../types'
import { join } from 'path'

export class VideoProcessor {
  static async processVideo(
    inputPath: string,
    outputPath: string,
    options: VideoProcessingOptions
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      let command = ffmpeg(inputPath)

      // Basic options
      if (options.quality) {
        command = command.videoBitrate(options.quality)
      }

      if (options.format) {
        command = command.toFormat(options.format)
      }

      if (options.resolution) {
        command = command.size(options.resolution)
      }

      // FPS control
      if (options.fps) {
        command = command.fps(options.fps)
      }

      // Audio/Video codecs
      if (options.audioCodec) {
        command = command.audioCodec(options.audioCodec)
      }

      if (options.videoCodec) {
        command = command.videoCodec(options.videoCodec)
      }

      // Trim video
      if (options.trim) {
        if (options.trim.start) {
          command = command.setStartTime(options.trim.start)
        }
        if (options.trim.duration) {
          command = command.setDuration(options.trim.duration)
        }
      }

      // Apply filters
      if (options.filters) {
        const filterCommands: string[] = []
        
        if (options.filters.brightness) {
          filterCommands.push(`brightness=${options.filters.brightness}`)
        }
        if (options.filters.contrast) {
          filterCommands.push(`contrast=${options.filters.contrast}`)
        }
        if (options.filters.saturation) {
          filterCommands.push(`saturation=${options.filters.saturation}`)
        }

        if (filterCommands.length > 0) {
          command = command.videoFilters(filterCommands)
        }
      }

      // Add watermark
      if (options.watermark) {
        const overlay = this.getWatermarkPosition(options.watermark.position)
        command = command.complexFilter([
          {
            filter: 'overlay',
            options: overlay
          }
        ])
      }

      // Generate thumbnail if requested
      if (options.thumbnail) {
        const thumbnailPath = outputPath.replace(/\.[^/.]+$/, "_thumb.jpg")
        command = command.screenshots({
          timestamps: ['50%'],
          filename: thumbnailPath,
          size: '320x240'
        })
      }

      command
        .on('progress', (progress) => {
          console.log(`Processing: ${progress.percent}% done`)
        })
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err))
        .save(outputPath)
    })
  }

  private static getWatermarkPosition(position: string): string {
    switch (position) {
      case 'topLeft': return '10:10'
      case 'topRight': return 'W-w-10:10'
      case 'bottomLeft': return '10:H-h-10'
      case 'bottomRight': return 'W-w-10:H-h-10'
      default: return '(W-w)/2:(H-h)/2' // center
    }
  }
} 