import { CookieSerializeOptions } from 'cookie'
import { Inngest } from 'inngest'
import { type ChatCompletionRequestMessage } from 'openai-edge'
import { z } from 'zod'

import { CourseBuilderAdapter } from './adapters'
import { Cookie } from './lib/utils/cookie'
import { LoggerInstance } from './lib/utils/logger'
import { EmailListConfig, ProviderType, TranscriptionConfig } from './providers'
import {
	ContentResourceResourceSchema,
	ContentResourceSchema,
} from './schemas/content-resource-schema'

export type Awaitable<T> = T | PromiseLike<T>

export type ContentResource = z.infer<typeof ContentResourceSchema> & {
	resources?: ContentResourceResource[] | null
}
export type ContentResourceResource = z.infer<
	typeof ContentResourceResourceSchema
> & {
	resource?: ContentResource | null
}

export interface ResponseInternal<
	Body extends string | Record<string, any> | any[] | null = any,
> {
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

export type CourseBuilderAction =
	| 'webhook'
	| 'srt'
	| 'session'
	| 'subscribe-to-list'

export interface RequestInternal {
	url: URL
	method: 'POST' | 'GET'
	cookies?: Partial<Record<string, string>>
	headers?: Record<string, any>
	query?: Record<string, any>
	body?: Record<string, any>
	action: CourseBuilderAction
	providerId?: string
	error?: string
}

export type InternalProvider<T = ProviderType> = T extends 'transcription'
	? TranscriptionConfig
	: T extends 'email-list'
		? EmailListConfig
		: never

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
	callbacks: CallbacksOptions
}

export interface CookieOption {
	name: string
	options: CookieSerializeOptions
}

export interface CookiesOptions {}

export interface DefaultCourseBuilderSession {}

export interface CourseBuilderSession extends DefaultCourseBuilderSession {}

export interface CallbacksOptions {
	session: (
		params: any,
	) => Awaitable<CourseBuilderSession | DefaultCourseBuilderSession>
}

export type FunctionCall = {
	arguments: Record<string, any>
	name: string // function name.
}

export type AIMessage = ChatCompletionRequestMessage & {
	content: null | string
	createdAt?: Date
	id?: string
}

export type AIError = { error: string }

export type AIOutput = AIMessage | AIError

export interface ProgressWriter {
	writeResponseInChunks(
		streamingResponse: Response | ReadableStream,
	): Promise<AIOutput>
	publishMessage(message: string): Promise<void>
}
