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
	ENSURE_PERSONAL_ORGANIZATION_EVENT,
	EnsurePersonalOrganization,
} from '@/inngest/events/ensure-personal-organization'
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
	VIDEO_ATTACHED_EVENT,
	VIDEO_DETACHED_EVENT,
	VideoAttached,
	VideoDetached,
} from '@/inngest/events/video-attachment'
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
import type {
	PURCHASE_TRANSFERRED_API_EVENT,
	PURCHASE_TRANSFERRED_EVENT,
	PurchaseTransferred,
	PurchaseTransferredApi,
} from '@coursebuilder/core/inngest/purchase-transfer/event-purchase-transferred'
import {
	STRIPE_CHECKOUT_SESSION_COMPLETED_EVENT,
	StripeCheckoutSessionCompleted,
} from '@coursebuilder/core/inngest/stripe/event-checkout-session-completed'
import DeepgramProvider from '@coursebuilder/core/providers/deepgram'
import OpenAIProvider from '@coursebuilder/core/providers/openai'
import PartykitProvider from '@coursebuilder/core/providers/partykit'

import {
	BULK_CALENDAR_INVITE_EVENT,
	BulkCalendarInviteSent,
} from './events/bulk-calendar-invites'
import {
	COHORT_UPDATED_EVENT,
	CohortUpdatedPayload,
} from './events/cohort-management'
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
	RESOURCE_CREATED_EVENT,
	RESOURCE_UPDATED_EVENT,
	type ResourceCreated,
	type ResourceUpdated,
} from './events/resource-management'
import {
	REQUEST_VIDEO_SPLIT_POINTS,
	type RequestVideoSplitPoints,
} from './events/split_video'
import {
	CREATE_USER_ORGANIZATIONS_EVENT,
	CreateUserOrganizations,
} from './functions/create-user-organization'
import {
	USER_ADDED_TO_COHORT_EVENT,
	USER_ADDED_TO_WORKSHOP_EVENT,
	UserAddedToCohort,
	UserAddedToWorkshop,
} from './functions/discord/add-discord-role-workflow'

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
	[VIDEO_ATTACHED_EVENT]: VideoAttached
	[VIDEO_DETACHED_EVENT]: VideoDetached
	[PURCHASE_TRANSFERRED_EVENT]: PurchaseTransferred
	[PURCHASE_TRANSFERRED_API_EVENT]: PurchaseTransferredApi
	[RESOURCE_CREATED_EVENT]: ResourceCreated
	[RESOURCE_UPDATED_EVENT]: ResourceUpdated
	[ENSURE_PERSONAL_ORGANIZATION_EVENT]: EnsurePersonalOrganization
	[USER_ADDED_TO_COHORT_EVENT]: UserAddedToCohort
	[USER_ADDED_TO_WORKSHOP_EVENT]: UserAddedToWorkshop
	[COHORT_UPDATED_EVENT]: { data: CohortUpdatedPayload }
	[BULK_CALENDAR_INVITE_EVENT]: BulkCalendarInviteSent
	['backfill/discord-role-entitlements']: {
		data: {
			productType?: 'cohort' | 'self-paced'
			limit?: number
			offset?: number
		}
	}
	['sync/discord-roles-for-entitlements']: {
		data: {
			productId?: string
			productType?: 'cohort' | 'self-paced'
			limit?: number
			offset?: number
		}
	}
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
