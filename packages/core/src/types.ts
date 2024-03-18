import { CookieSerializeOptions } from 'cookie'
import { Inngest } from 'inngest'

import { CourseBuilderAdapter } from './adapters'
import { Cookie } from './lib/utils/cookie'
import { LoggerInstance } from './lib/utils/logger'
import { ProviderType, TranscriptionConfig } from './providers'

export type Awaitable<T> = T | PromiseLike<T>

export interface ContentResource {
  id: string
  type: string
  createdById: string
  fields: Record<string, any> | null
}

export interface ResponseInternal<Body extends string | Record<string, any> | any[] | null = any> {
  status?: number
  headers?: Headers | HeadersInit
  body?: Body
  redirect?: string
  cookies?: Cookie[]
}

export interface CookieOption {
  name: string
  options: CookieSerializeOptions
}

export type CourseBuilderAction = 'webhook'

export interface RequestInternal {
  url: URL
  method: 'POST'
  cookies?: Partial<Record<string, string>>
  headers?: Record<string, any>
  query?: Record<string, any>
  body?: Record<string, any>
  action: CourseBuilderAction
  providerId?: string
  error?: string
}

/** @internal */
export type InternalProvider<T = ProviderType> = T extends 'transcription' ? TranscriptionConfig : never

export interface InternalOptions<TProviderType = ProviderType> {
  providers: InternalProvider[]
  url: URL
  action: CourseBuilderAction
  provider: InternalProvider<TProviderType>
  debug: boolean
  logger: LoggerInstance
  adapter: Required<CourseBuilderAdapter> | undefined
  cookies: Record<keyof CookiesOptions, CookieOption>
  basePath: string
  inngest: Inngest
}

export interface CookieOption {
  name: string
  options: CookieSerializeOptions
}

export interface CookiesOptions {}
