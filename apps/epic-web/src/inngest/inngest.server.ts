import { courseBuilderAdapter } from '@/db'
import { env } from '@/env.mjs'
import {
	IMAGE_RESOURCE_CREATED_EVENT,
	ImageResourceCreated,
} from '@/inngest/events/image-resource-created'
import { USER_CREATED_EVENT, UserCreated } from '@/inngest/events/user-created'
import { authOptions } from '@/server/auth'
import { EventSchemas, Inngest } from 'inngest'
import { UTApi } from 'uploadthing/server'

import { CourseBuilderCoreEvents } from '@coursebuilder/core/inngest'
import {
	RESOURCE_CHAT_REQUEST_EVENT,
	ResourceChat,
} from '@coursebuilder/core/inngest/co-gardener/resource-chat'
import { createInngestMiddleware } from '@coursebuilder/core/inngest/create-inngest-middleware'
import DeepgramProvider from '@coursebuilder/core/providers/deepgram'
import OpenAIProvider from '@coursebuilder/core/providers/openai'
import PartykitProvider from '@coursebuilder/core/providers/partykit'

// Create a client to send and receive events
export type Events = {
	[IMAGE_RESOURCE_CREATED_EVENT]: ImageResourceCreated
	[RESOURCE_CHAT_REQUEST_EVENT]: ResourceChat
	[USER_CREATED_EVENT]: UserCreated
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
	getAuthConfig: () => authOptions,
})

export const inngest = new Inngest({
	id: env.INNGEST_APP_NAME,
	middleware: [middleware],
	schemas: new EventSchemas().fromRecord<Events & CourseBuilderCoreEvents>(),
})
