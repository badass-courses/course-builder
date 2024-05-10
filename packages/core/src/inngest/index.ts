import {
	RESOURCE_CHAT_REQUEST_EVENT,
	resourceChat,
	ResourceChat,
} from './co-gardener/resource-chat'
import {
	NEW_PURCHASE_CREATED_EVENT,
	NewPurchaseCreated,
} from './commerce/event-new-purchase-created'
import { sendPostPurchaseEmail } from './commerce/send-post-purchase-email'
import {
	STRIPE_CHECKOUT_SESSION_COMPLETED_EVENT,
	stripeCheckoutSessionComplete,
	StripeCheckoutSessionCompleted,
} from './stripe/event-checkout-session-completed'
import {
	EventVideoMuxWebhook,
	MUX_WEBHOOK_EVENT,
} from './video-processing/events/event-video-mux-webhook'
import {
	VIDEO_RESOURCE_CREATED_EVENT,
	VideoResourceCreated,
} from './video-processing/events/event-video-resource'
import {
	VIDEO_SRT_READY_EVENT,
	VideoSrtReady,
} from './video-processing/events/event-video-srt-ready-to-asset'
import {
	EventVideoStatusCheck,
	VIDEO_STATUS_CHECK_EVENT,
} from './video-processing/events/event-video-status-check'
import {
	EventVideoTranscriptReady,
	VIDEO_TRANSCRIPT_READY_EVENT,
} from './video-processing/events/event-video-transcript-ready'
import {
	EventVideoUploaded,
	VIDEO_UPLOADED_EVENT,
} from './video-processing/events/event-video-uploaded'
import { coreVideoProcessingFunctions } from './video-processing/functions'

export type CourseBuilderCoreEvents = {
	[VIDEO_STATUS_CHECK_EVENT]: EventVideoStatusCheck
	[VIDEO_TRANSCRIPT_READY_EVENT]: EventVideoTranscriptReady
	[VIDEO_SRT_READY_EVENT]: VideoSrtReady
	[VIDEO_UPLOADED_EVENT]: EventVideoUploaded
	[VIDEO_RESOURCE_CREATED_EVENT]: VideoResourceCreated
	[MUX_WEBHOOK_EVENT]: EventVideoMuxWebhook
	[RESOURCE_CHAT_REQUEST_EVENT]: ResourceChat
	[STRIPE_CHECKOUT_SESSION_COMPLETED_EVENT]: StripeCheckoutSessionCompleted
	[NEW_PURCHASE_CREATED_EVENT]: NewPurchaseCreated
}

export const courseBuilderCoreFunctions = [
	...coreVideoProcessingFunctions,
	sendPostPurchaseEmail,
	stripeCheckoutSessionComplete,
	resourceChat,
]
