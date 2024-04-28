import { courseBuilderAdapter } from '@/db'
import { env } from '@/env.mjs'
import {
	EMAIL_SEND_BROADCAST,
	EmailSendBroadcast,
} from '@/inngest/events/email-send-broadcast'
import {
	IMAGE_RESOURCE_CREATED_EVENT,
	ImageResourceCreated,
} from '@/inngest/events/image-resource-created'
import {
	POSTMARK_WEBHOOK_EVENT,
	PostmarkWebhook,
} from '@/inngest/events/postmark-webhook'
import { USER_CREATED_EVENT, UserCreated } from '@/inngest/events/user-created'
import { EventSchemas, Inngest } from 'inngest'
import { UTApi } from 'uploadthing/server'

import { createInngestMiddleware } from '@coursebuilder/core/inngest/create-inngest-middleware'

import '@coursebuilder/core/inngest/video-processing/events'

import { emailProvider } from '@/coursebuilder/email-provider'
import {
	LESSON_COMPLETED_EVENT,
	LessonCompleted,
} from '@/inngest/events/lesson-completed'
import { authOptions } from '@/server/auth'

import {
	RESOURCE_CHAT_REQUEST_EVENT,
	ResourceChat,
} from '@coursebuilder/core/inngest/co-gardener/resource-chat'
import { CourseBuilderCoreEvents } from '@coursebuilder/core/inngest/video-processing/events'
import DeepgramProvider from '@coursebuilder/core/providers/deepgram'
import OpenAIProvider from '@coursebuilder/core/providers/openai'
import PartykitProvider from '@coursebuilder/core/providers/partykit'

import {
	CONCEPT_SELECTED,
	CONCEPT_TAGS_REQUESTED,
	REQUEST_CONCEPT_SELECTION,
	type ConceptSelected,
	type ConceptTagsRequested,
	type RequestConceptSelection,
} from './events/concepts'
import { OCR_WEBHOOK_EVENT, OcrWebhook } from './events/ocr-webhook'
import {
	REQUEST_VIDEO_SPLIT_POINTS,
	type RequestVideoSplitPoints,
} from './events/split_video'

// Create a client to send and receive events
export type Events = {
	[USER_CREATED_EVENT]: UserCreated
	[POSTMARK_WEBHOOK_EVENT]: PostmarkWebhook
	[IMAGE_RESOURCE_CREATED_EVENT]: ImageResourceCreated
	[RESOURCE_CHAT_REQUEST_EVENT]: ResourceChat
	[EMAIL_SEND_BROADCAST]: EmailSendBroadcast
	[OCR_WEBHOOK_EVENT]: OcrWebhook
	[CONCEPT_TAGS_REQUESTED]: ConceptTagsRequested
	[REQUEST_CONCEPT_SELECTION]: RequestConceptSelection
	[CONCEPT_SELECTED]: ConceptSelected
	[REQUEST_VIDEO_SPLIT_POINTS]: RequestVideoSplitPoints
	[LESSON_COMPLETED_EVENT]: LessonCompleted
}

const callbackBase =
	env.NODE_ENV === 'production' ? env.UPLOADTHING_URL : env.NEXT_PUBLIC_URL

const middleware = createInngestMiddleware({
	db: courseBuilderAdapter,
	siteRootUrl: env.NEXT_PUBLIC_URL,
	mediaUploadProvider: new UTApi(),
	openaiProvider: OpenAIProvider({
		apiKey: env.OPENAI_API_KEY,
		partyUrlBase: env.NEXT_PUBLIC_PARTY_KIT_URL,
	}),
	partyProvider: PartykitProvider({
		partyUrlBase: env.NEXT_PUBLIC_PARTY_KIT_URL,
	}),
	transcriptProvider: DeepgramProvider({
		apiKey: env.DEEPGRAM_API_KEY,
		callbackUrl: `${callbackBase}/api/coursebuilder/webhook/deepgram`,
	}),
	emailProvider,
	getAuthConfig: () => authOptions,
})

export const inngest = new Inngest({
	id: env.NEXT_PUBLIC_APP_NAME,
	middleware: [middleware],
	schemas: new EventSchemas().fromRecord<Events & CourseBuilderCoreEvents>(),
})
