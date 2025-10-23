import {
	RESOURCE_CHAT_REQUEST_EVENT,
	resourceChat,
	ResourceChat,
} from './co-gardener/resource-chat'
import type {
	FULL_PRICE_COUPON_REDEEMED_EVENT,
	FullPriceCouponRedeemed,
} from './commerce/event-full-price-coupon-redeemed'
import {
	NEW_PURCHASE_CREATED_EVENT,
	NewPurchaseCreated,
} from './commerce/event-new-purchase-created'
import {
	NEW_SUBSCRIPTION_CREATED_EVENT,
	NewSubscriptionCreated,
} from './commerce/event-new-subscription-created'
import {
	PURCHASE_STATUS_UPDATED_EVENT,
	PurchaseStatusUpdated,
	updatePurchaseStatus,
} from './commerce/event-purchase-status-updated'
import {
	REFUND_PROCESSED_EVENT,
	RefundProcessed,
} from './commerce/event-refund-processed'
import { sendCreatorSlackNotification } from './commerce/send-creator-slack-notification'
import { sendPostPurchaseEmail } from './commerce/send-post-purchase-email'
import {
	STRIPE_CHECKOUT_SESSION_COMPLETED_EVENT,
	stripeCheckoutSessionComplete,
	StripeCheckoutSessionCompleted,
} from './stripe/event-checkout-session-completed'
import {
	STRIPE_CUSTOMER_SUBSCRIPTION_CREATED_EVENT,
	stripeCustomerSubscriptionCreated,
	StripeCustomerSubscriptionCreated,
} from './stripe/event-customer-subscription-created'
import {
	STRIPE_CUSTOMER_SUBSCRIPTION_UPDATED_EVENT,
	stripeCustomerSubscriptionUpdated,
	StripeCustomerSubscriptionUpdated,
} from './stripe/event-customer-subscription-updated'
import {
	STRIPE_INVOICE_PAYMENT_SUCCEEDED_EVENT,
	stripeInvoicePaymentSucceeded,
	StripeInvoicePaymentSucceeded,
} from './stripe/event-invoice-payment-succeeded'
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
	[STRIPE_CUSTOMER_SUBSCRIPTION_CREATED_EVENT]: StripeCustomerSubscriptionCreated
	[STRIPE_CUSTOMER_SUBSCRIPTION_UPDATED_EVENT]: StripeCustomerSubscriptionUpdated
	[STRIPE_INVOICE_PAYMENT_SUCCEEDED_EVENT]: StripeInvoicePaymentSucceeded
	[PURCHASE_STATUS_UPDATED_EVENT]: PurchaseStatusUpdated
	[NEW_PURCHASE_CREATED_EVENT]: NewPurchaseCreated
	[NEW_SUBSCRIPTION_CREATED_EVENT]: NewSubscriptionCreated
	[FULL_PRICE_COUPON_REDEEMED_EVENT]: FullPriceCouponRedeemed
	[REFUND_PROCESSED_EVENT]: RefundProcessed
}

export const courseBuilderCoreFunctions = [
	...coreVideoProcessingFunctions,
	sendPostPurchaseEmail,
	// stripeCheckoutSessionComplete,
	// stripeCustomerSubscriptionCreated,
	// stripeCustomerSubscriptionUpdated,
	// stripeInvoicePaymentSucceeded,
	// sendCreatorSlackNotification,
	resourceChat,
	// updatePurchaseStatus,
]
