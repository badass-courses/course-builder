import type { IncomingHttpHeaders } from 'node:http'

import type { FileRouter, Json, RouterWithConfig } from './types'

function messageFromUnknown(cause: unknown, fallback?: string) {
  if (typeof cause === 'string') {
    return cause
  }
  if (cause instanceof Error) {
    return cause.message
  }
  if (cause && typeof cause === 'object' && 'message' in cause && typeof cause.message === 'string') {
    return cause.message
  }
  return fallback ?? 'An unknown error occurred'
}

const ERROR_CODES = {
  // Generic
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  INTERNAL_SERVER_ERROR: 500,
  INTERNAL_CLIENT_ERROR: 500,

  // S3 specific
  TOO_LARGE: 413,
  TOO_SMALL: 400,
  TOO_MANY_FILES: 400,
  KEY_TOO_LONG: 400,

  // UploadThing specific
  URL_GENERATION_FAILED: 500,
  UPLOAD_FAILED: 500,
  MISSING_ENV: 500,
  FILE_LIMIT_EXCEEDED: 500,
} as const

type ErrorCode = keyof typeof ERROR_CODES

export class UploadThingError<TShape extends Json = { message: string }> extends Error {
  public readonly cause?: Error
  public readonly code: ErrorCode
  public readonly data?: TShape

  constructor(opts: { code: keyof typeof ERROR_CODES; message?: string; cause?: unknown; data?: TShape }) {
    const message = opts.message ?? messageFromUnknown(opts.cause, opts.code)

    super(message)
    this.code = opts.code
    this.data = opts.data

    if (opts.cause instanceof Error) {
      this.cause = opts.cause
    } else if (opts.cause instanceof Response) {
      this.cause = new Error(`Response ${opts.cause.status} ${opts.cause.statusText}`)
    } else if (typeof opts.cause === 'string') {
      this.cause = new Error(opts.cause)
    } else {
      this.cause = undefined
    }
  }
}

export type Overwrite<T, U> = Omit<T, keyof U> & U
export type WithRequired<T, K extends keyof T> = T & Required<Pick<T, K>>

export function getUrl() {
  /**
   * The pathname must be /api/coursebuilder
   * since we call that via webhook, so the user
   * should not override that. Just the protocol and host
   *
   * User can override the callback url with the COURSEBUILDER_URL env var,
   * if they do, they should include the protocol
   */
  const uturl = process.env.COURSEBUILDER_URL
  if (uturl) return `${uturl}/api/coursebuilder`

  /**
   * If the VERCEL_URL is set, we will fall back to that next.
   * They don't set the protocol, however, so we need to add it
   */
  const vcurl = process.env.VERCEL_URL
  if (vcurl) return `https://${vcurl}/api/coursebuilder` // SSR should use vercel url

  return `http://localhost:${process.env.PORT ?? 3000}/api/coursebuilder` // dev SSR should use localhost
}

/**
 * A subset of the standard Response properties needed by UploadThing internally.
 * @see Response from lib.dom.d.ts
 */
export interface ResponseEsque {
  status: number
  ok: boolean
  /**
   * @remarks
   * The built-in Response::json() method returns Promise<any>, but
   * that's not as type-safe as unknown. We use unknown because we're
   * more type-safe. You do want more type safety, right? 😉
   */
  json<T = unknown>(): Promise<T>
  text(): Promise<string>

  clone(): ResponseEsque
}

export type RequestLike = Overwrite<
  WithRequired<Partial<Request>, 'json'>,
  {
    body?: any // we only use `.json`, don't care about `body`
    headers: Headers | IncomingHttpHeaders
  }
>
export async function safeParseJSON<T>(input: string | ResponseEsque | RequestLike): Promise<T | Error> {
  if (typeof input === 'string') {
    try {
      return JSON.parse(input) as T
    } catch (err) {
      console.error(`Error parsing JSON, got '${input}'`)
      return new Error(`Error parsing JSON, got '${input}'`)
    }
  }

  const clonedRes = input.clone?.()
  try {
    return (await input.json()) as T
  } catch (err) {
    const text = (await clonedRes?.text()) ?? 'unknown'
    console.error(`Error parsing JSON, got '${text}'`)
    return new Error(`Error parsing JSON, got '${text}'`)
  }
}

export const VALID_ACTION_TYPES = ['webhook', 'cron', 'failure'] as const
export type ActionType = (typeof VALID_ACTION_TYPES)[number]

export const VALID_WEBHOOK_SERVICE_TYPES = ['stripe', 'deepgram', 'sanity', 'mux'] as const
export type WebhookServiceType = (typeof VALID_WEBHOOK_SERVICE_TYPES)[number]

export const buildRequestHandler = <TRouter extends FileRouter>(opts: RouterWithConfig<TRouter>) => {
  return async (input: {
    req: RequestLike
    params: { coursebuilder: string[] }
    res?: unknown
    event?: unknown
  }): Promise<UploadThingError | { status: 200; body?: any }> => {
    console.log(input)

    const { req, res, event } = input
    const { router, config } = opts

    // Get inputs from query and params
    const searchParams = new URL(req.url ?? '', getUrl()).searchParams
    const actionType = (input.params.coursebuilder[0] as ActionType) ?? undefined

    console.log({ actionType, type: typeof actionType })

    // Validate inputs

    if (actionType && typeof actionType !== 'string') {
      return new UploadThingError({
        code: 'BAD_REQUEST',
        message: '`actionType` must be a string',
        cause: `Expected actionType to be of type 'string', got '${typeof actionType}'`,
      })
    }

    if (!actionType || !VALID_ACTION_TYPES.includes(actionType)) {
      // This would either be someone spamming or the AWS webhook
      return new UploadThingError({
        code: 'BAD_REQUEST',
        cause: `Invalid action type ${actionType}`,
        message: `Expected ${VALID_ACTION_TYPES.map((x) => `"${x}"`)
          .join(', ')
          .replace(/,(?!.*,)/, ' or')} but got "${actionType}"`,
      })
    }

    switch (actionType) {
      case 'webhook':
        const forService = input.params.coursebuilder[1] as WebhookServiceType
        switch (forService) {
          case 'stripe':
            return { body: await safeParseJSON('{"message": "hi stripe"}'), status: 200 }
          case 'deepgram':
            return { body: await safeParseJSON('{"message": "hi deepgram"}'), status: 200 }
          case 'sanity':
            return { body: await safeParseJSON('{"message": "hi sanity"}'), status: 200 }
          case 'mux':
            return { body: await safeParseJSON('{"message": "hi mux"}'), status: 200 }
          default:
            return new UploadThingError({
              code: 'BAD_REQUEST',
              cause: `Invalid action type ${forService}`,
              message: `Expected ${VALID_WEBHOOK_SERVICE_TYPES.map((x) => `"${x}"`)
                .join(', ')
                .replace(/,(?!.*,)/, ' or')} but got "${forService}"`,
            })
        }
      default: {
        // This should never happen
        return new UploadThingError({
          code: 'BAD_REQUEST',
          message: `Invalid action type`,
        })
      }
    }
  }
}

export function defaultErrorFormatter(error: UploadThingError) {
  return {
    message: error.message,
  }
}

export function getStatusCodeFromError(error: UploadThingError<any>) {
  return ERROR_CODES[error.code] ?? 500
}

export type inferErrorShape<TRouter extends FileRouter> = TRouter[keyof TRouter]['_def']['_errorShape']

export function formatError<TRouter extends FileRouter>(
  error: UploadThingError,
  router: TRouter,
): inferErrorShape<TRouter> {
  const errorFormatter = router[Object.keys(router)[0]]?._def.errorFormatter ?? defaultErrorFormatter

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return errorFormatter(error)
}

export const createServerHandler = <TRouter extends FileRouter>(opts: RouterWithConfig<TRouter>) => {
  const requestHandler = buildRequestHandler<TRouter>(opts)

  const POST = async (request: Request | { request: Request }, { params }: { params: { coursebuilder: string[] } }) => {
    const req = request instanceof Request ? request : request.request
    const response = await requestHandler({ req, params })

    if (response instanceof Error) {
      return new Response(JSON.stringify(formatError(response, opts.router)), {
        status: getStatusCodeFromError(response),
      })
    }
    if (response.status !== 200) {
      // We messed up - this should never happen
      return new Response('An unknown error occured', {
        status: 500,
      })
    }

    return new Response(JSON.stringify(response.body), {
      status: response.status,
    })
  }

  const GET = (request: Request | { request: Request }, { params }: { params: { coursebuilder: string[] } }) => {
    const _req = request instanceof Request ? request : request.request

    return new Response(JSON.stringify({}), {
      status: 200,
    })
  }

  return { GET, POST }
}
