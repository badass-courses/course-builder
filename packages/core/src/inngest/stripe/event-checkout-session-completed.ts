import { z } from 'zod'

import { CheckoutSessionCompletedEvent } from '../../schemas/stripe/checkout-session-completed'
import {
	CoreInngestFunctionInput,
	CoreInngestHandler,
	CoreInngestTrigger,
} from '../create-inngest-middleware'
import { VIDEO_SRT_READY_EVENT } from '../video-processing/events/event-video-srt-ready-to-asset'

export const STRIPE_CHECKOUT_SESSION_COMPLETED_EVENT =
	'stripe/checkout-session-completed'

export type StripeCheckoutSessionCompleted = {
	name: typeof STRIPE_CHECKOUT_SESSION_COMPLETED_EVENT
	data: {
		stripeEvent: CheckoutSessionCompletedEvent
	}
}

export const stripeCheckoutSessionCompletedConfig = {
	id: 'stripe-checkout-session-completed',
	name: 'Stripe Checkout Session Completed',
}

export const stripeCheckoutSessionCompletedTrigger: CoreInngestTrigger = {
	event: STRIPE_CHECKOUT_SESSION_COMPLETED_EVENT,
}

export const stripeCheckoutSessionCompletedHandler: CoreInngestHandler =
	async ({ event, step, db, siteRootUrl }: CoreInngestFunctionInput) => {
		const stripeEvent = event.data.stripeEvent

		console.log({ stripeEvent }, stripeEvent.data)
	}
