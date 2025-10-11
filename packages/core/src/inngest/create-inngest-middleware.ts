import { AuthConfig } from '@auth/core'
import { NodemailerConfig } from '@auth/core/providers/nodemailer'
import { realtimeMiddleware } from '@inngest/realtime/middleware'
import {
	EventSchemas,
	GetEvents,
	GetFunctionInput,
	Handler,
	Inngest,
	InngestFunction,
	InngestMiddleware,
} from 'inngest'

import {
	MockCourseBuilderAdapter,
	type CourseBuilderAdapter,
} from '../adapters'
import {
	MockTranscriptionProvider,
	type TranscriptionConfig,
} from '../providers'
import { LlmProviderConfig, MockOpenAIProvider } from '../providers/openai'
import {
	MockPartykitProvider,
	PartyProviderConfig,
} from '../providers/partykit'
import {
	mockSlackProvider,
	NotificationProviderConfig,
} from '../providers/slack'
import { MockStripeProvider } from '../providers/stripe'
import { PaymentsProviderConfig } from '../types'
import { CourseBuilderCoreEvents } from './index'

export interface CoreInngestContext {
	db: CourseBuilderAdapter
	siteRootUrl: string
	transcriptProvider: TranscriptionConfig
	openaiProvider: LlmProviderConfig
	partyProvider: PartyProviderConfig
	paymentProvider?: PaymentsProviderConfig
	emailProvider?: NodemailerConfig
	notificationProvider?: NotificationProviderConfig
	getAuthConfig: () => AuthConfig
	mediaUploadProvider: {
		deleteFiles: (fileKey: string) => Promise<{ success: boolean }>
	}
}

export type CoreInngestFunctionInput = GetFunctionInput<CoreInngest>
export type CoreInngestTrigger = InngestFunction.Trigger<
	keyof GetEvents<CoreInngest>
>
export type CoreInngestHandler = Handler.Any

export const createInngestMiddleware = <
	TCourseBuilderContext extends CoreInngestContext = CoreInngestContext,
>(
	context: TCourseBuilderContext,
) => {
	return new InngestMiddleware({
		name: 'Course Builder Middleware',
		init() {
			return {
				onFunctionRun() {
					return {
						transformInput() {
							// kill me - this middleware is just for types
							type MappedCoreContext = {
								[K in keyof TCourseBuilderContext]: TCourseBuilderContext[K]
							}

							return { ctx: context as unknown as MappedCoreContext }
						},
					}
				},
			}
		},
	})
}

const schemas = new EventSchemas().fromRecord<CourseBuilderCoreEvents>()

export const coreInngest = new Inngest({
	id: 'core-inngest',
	schemas,
	middleware: [
		realtimeMiddleware(),
		createInngestMiddleware({
			db: MockCourseBuilderAdapter,
			siteRootUrl: '',
			partyKitRootUrl: '',
			transcriptProvider: MockTranscriptionProvider,
			openaiProvider: MockOpenAIProvider,
			partyProvider: MockPartykitProvider,
			paymentProvider: MockStripeProvider,
			emailProvider: {} as NodemailerConfig,
			notificationProvider: mockSlackProvider,
			getAuthConfig: () => ({}) as AuthConfig,
			mediaUploadProvider: {
				deleteFiles: async (_) => Promise.resolve({ success: true }),
			},
		}),
	],
})

export type CoreInngest = typeof coreInngest
