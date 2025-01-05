import ffmpeg from 'fluent-ffmpeg'
import { VideoProcessingOptions } from '../types'

export class VideoProcessor {
  static async processVideo(
    inputPath: string,
    outputPath: string,
    options: VideoProcessingOptions
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      let command = ffmpeg(inputPath)

      if (options.quality) {
        command = command.videoBitrate(options.quality)
      }

      if (options.format) {
        command = command.toFormat(options.format)
      }

      if (options.resolution) {
        command = command.size(options.resolution)
      }

      command
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err))
        .save(outputPath)
    })
  }
} 