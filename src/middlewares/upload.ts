import { Context, Next } from 'hono'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import crypto from 'node:crypto'

export const upload = () => {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.parseBody()
      const file = body.video as File

      if (!file) {
        throw new Error('No file uploaded')
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${crypto.randomBytes(16).toString('hex')}.${fileExt}`
      const uploadDir = './uploads'
      const filePath = join(uploadDir, fileName)

      // Ensure upload directory exists
      await createUploadDirIfNotExists(uploadDir)

      // Save the file
      const arrayBuffer = await file.arrayBuffer()
      await writeFile(filePath, Buffer.from(arrayBuffer))

      // Instead of attaching to c.req.file, use c.set()
      c.set('uploadedFile', {
        path: filePath,
        filename: fileName
      })

      await next()
    } catch (error) {
      throw new Error(`Upload failed: ${(error as Error).message || 'Unknown error'}`)
    }
  }
}

async function createUploadDirIfNotExists(dir: string) {
  const fs = await import('fs/promises')
  try {
    await fs.access(dir)
  } catch {
    await fs.mkdir(dir, { recursive: true })
  }
} 