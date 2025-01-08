import { emailProvider } from '@/coursebuilder/email-provider'
import { slackProvider } from '@/coursebuilder/slack-provider'
import { stripeProvider } from '@/coursebuilder/stripe-provider'
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
	LESSON_COMPLETED_EVENT,
	LessonCompleted,
} from '@/inngest/events/lesson-completed'
import {
	NO_PROGRESS_MADE_EVENT,
	NoProgressMade,
} from '@/inngest/events/no-progress-made-event'
import {
	OAUTH_PROVIDER_ACCOUNT_LINKED_EVENT,
	OauthProviderAccountLinked,
} from '@/inngest/events/oauth-provider-account-linked'
import {
	POSTMARK_WEBHOOK_EVENT,
	PostmarkWebhook,
} from '@/inngest/events/postmark-webhook'
import { USER_CREATED_EVENT, UserCreated } from '@/inngest/events/user-created'
import {
	SYNC_PURCHASE_TAGS_EVENT,
	SyncPurchaseTags,
} from '@/inngest/functions/sync-purchase-tags'
import { authOptions } from '@/server/auth'
import { EventSchemas, Inngest } from 'inngest'
import { UTApi } from 'uploadthing/server'

import { CourseBuilderCoreEvents } from '@coursebuilder/core/inngest'
import {
	RESOURCE_CHAT_REQUEST_EVENT,
	ResourceChat,
} from '@coursebuilder/core/inngest/co-gardener/resource-chat'
import {
	NEW_SUBSCRIPTION_CREATED_EVENT,
	NewSubscriptionCreated,
} from '@coursebuilder/core/inngest/commerce/event-new-subscription-created'
import { createInngestMiddleware } from '@coursebuilder/core/inngest/create-inngest-middleware'
import {
	STRIPE_CHECKOUT_SESSION_COMPLETED_EVENT,
	StripeCheckoutSessionCompleted,
} from '@coursebuilder/core/inngest/stripe/event-checkout-session-completed'
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
import {
	CREATE_USER_ORGANIZATIONS_EVENT,
	CreateUserOrganizations,
} from './functions/create-user-organization'

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
	[OAUTH_PROVIDER_ACCOUNT_LINKED_EVENT]: OauthProviderAccountLinked
	[NO_PROGRESS_MADE_EVENT]: NoProgressMade
	[SYNC_PURCHASE_TAGS_EVENT]: SyncPurchaseTags
	[STRIPE_CHECKOUT_SESSION_COMPLETED_EVENT]: StripeCheckoutSessionCompleted
	[CREATE_USER_ORGANIZATIONS_EVENT]: CreateUserOrganizations
	[NEW_SUBSCRIPTION_CREATED_EVENT]: NewSubscriptionCreated
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
	paymentProvider: stripeProvider,
	emailProvider,
	notificationProvider: slackProvider,
	getAuthConfig: () => authOptions,
})

export const inngest = new Inngest({
	id: env.NEXT_PUBLIC_APP_NAME,
	middleware: [middleware],
	schemas: new EventSchemas().fromRecord<Events & CourseBuilderCoreEvents>(),
})
