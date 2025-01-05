import { Context, Next } from 'hono'
import { HTTPException } from 'hono/http-exception'

export const errorHandler = () => {
  return async (c: Context, next: Next) => {
    try {
      await next()
    } catch (error) {
      console.error(error)
      if (error instanceof HTTPException) {
        return error.getResponse()
      }
      return c.json(
        { error: 'Internal Server Error' },
        500
      )
    }
  }
} 