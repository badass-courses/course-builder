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
import { CourseBuilderCoreEvents } from './video-processing/events'

export interface CoreInngestContext {
	db: CourseBuilderAdapter
	siteRootUrl: string
	partyKitRootUrl: string
	transcriptProvider: TranscriptionConfig
	openaiProvider: LlmProviderConfig
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
		createInngestMiddleware({
			db: MockCourseBuilderAdapter,
			siteRootUrl: '',
			partyKitRootUrl: '',
			transcriptProvider: MockTranscriptionProvider,
			openaiProvider: MockOpenAIProvider,
			mediaUploadProvider: {
				deleteFiles: async (_) => Promise.resolve({ success: true }),
			},
		}),
	],
})

export type CoreInngest = typeof coreInngest
