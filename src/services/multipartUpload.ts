import { createWriteStream } from 'fs'
import { join } from 'path'
import { nanoid } from 'nanoid'
import { mkdir, access } from 'fs/promises'
import { wsServer } from './wsServer'

export class MultipartUploadHandler {
  private static async createUploadDirIfNotExists(dir: string) {
    try {
      await access(dir)
    } catch {
      await mkdir(dir, { recursive: true })
    }
  }

  static async handleChunkedUpload(
    chunk: Buffer,
    filename: string,
    totalChunks: number,
    currentChunk: number,
    jobId: string
  ): Promise<string> {
    const uploadDir = join('uploads', 'chunks', jobId)
    await this.createUploadDirIfNotExists(uploadDir)
    
    const chunkPath = join(uploadDir, `chunk_${currentChunk}`)
    
    return new Promise((resolve, reject) => {
      const writeStream = createWriteStream(chunkPath)
      
      writeStream.write(chunk)
      writeStream.end()
      
      writeStream.on('finish', () => {
        const progress = (currentChunk / totalChunks) * 100
        wsServer.broadcast({
          type: 'progress',
          jobId,
          data: {
            phase: 'upload',
            progress,
            currentChunk,
            totalChunks
          }
        })
        
        if (currentChunk === totalChunks) {
          this.mergeChunks(uploadDir, filename, jobId)
            .then(resolve)
            .catch(reject)
        } else {
          resolve(chunkPath)
        }
      })
    })
  }

  private static async mergeChunks(
    chunksDir: string,
    filename: string,
    jobId: string
  ): Promise<string> {
    const finalPath = join('uploads', `${nanoid()}_${filename}`)
    // Merge implementation...
    return finalPath
  }
} 