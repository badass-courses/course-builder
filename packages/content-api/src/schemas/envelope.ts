import { z } from 'zod'

export const ApiSuccessSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    ok: z.literal(true),
    data: dataSchema,
    meta: z
      .object({
        version: z.number().optional(),
      })
      .optional(),
  })

export const ApiErrorSchema = z.object({
  ok: z.literal(false),
  error: z.object({
    message: z.string(),
    code: z.string(),
    details: z.unknown().optional(),
  }),
})

export type ApiSuccess<T> = {
  ok: true
  data: T
  meta?: { version?: number }
}

export type ApiError = {
  ok: false
  error: { message: string; code: string; details?: unknown }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

export function success<T>(data: T, meta?: { version?: number }): ApiSuccess<T> {
  return { ok: true, data, ...(meta ? { meta } : {}) }
}

export function error(
  message: string,
  code: string,
  details?: unknown,
): ApiError {
  return { ok: false, error: { message, code, ...(details !== undefined ? { details } : {}) } }
}

export const PaginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
})

export type Pagination = z.infer<typeof PaginationSchema>

export type WithEnvelopeOptions = {
  successStatus?: number
  errorCodeMap?: Record<number, string>
}

const defaultErrorCodeMap: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'UNPROCESSABLE_ENTITY',
  429: 'RATE_LIMITED',
  500: 'INTERNAL_ERROR',
}

export function withEnvelope<T>(
  data: T,
  status: number,
  options?: WithEnvelopeOptions,
): { status: number; body: ApiResponse<T> } {
  if (status >= 200 && status < 300) {
    return { status, body: success(data) }
  }

  const codeMap = options?.errorCodeMap ?? defaultErrorCodeMap
  const errorData = data as { error?: string; message?: string; details?: unknown }
  const message = errorData?.error ?? errorData?.message ?? 'Unknown error'
  const code = codeMap[status] ?? 'ERROR'
  const details = errorData?.details

  return {
    status,
    body: error(message, code, details),
  }
}
