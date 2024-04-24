import {
	RESOURCE_CHAT_REQUEST_EVENT,
	ResourceChat,
} from '../../co-gardener/resource-chat'
import {
	STRIPE_CHECKOUT_SESSION_COMPLETED_EVENT,
	StripeCheckoutSessionCompleted,
} from '../../stripe/event-checkout-session-completed'
import {
	EventVideoMuxWebhook,
	MUX_WEBHOOK_EVENT,
} from './event-video-mux-webhook'
import {
	VIDEO_RESOURCE_CREATED_EVENT,
	VideoResourceCreated,
} from './event-video-resource'
import {
	VIDEO_SRT_READY_EVENT,
	VideoSrtReady,
} from './event-video-srt-ready-to-asset'
import {
	EventVideoStatusCheck,
	VIDEO_STATUS_CHECK_EVENT,
} from './event-video-status-check'
import {
	EventVideoTranscriptReady,
	VIDEO_TRANSCRIPT_READY_EVENT,
} from './event-video-transcript-ready'
import {
	EventVideoUploaded,
	VIDEO_UPLOADED_EVENT,
} from './event-video-uploaded'

export type CourseBuilderCoreEvents = {
	[VIDEO_STATUS_CHECK_EVENT]: EventVideoStatusCheck
	[VIDEO_TRANSCRIPT_READY_EVENT]: EventVideoTranscriptReady
	[VIDEO_SRT_READY_EVENT]: VideoSrtReady
	[VIDEO_UPLOADED_EVENT]: EventVideoUploaded
	[VIDEO_RESOURCE_CREATED_EVENT]: VideoResourceCreated
	[MUX_WEBHOOK_EVENT]: EventVideoMuxWebhook
	[RESOURCE_CHAT_REQUEST_EVENT]: ResourceChat
	[STRIPE_CHECKOUT_SESSION_COMPLETED_EVENT]: StripeCheckoutSessionCompleted
}
