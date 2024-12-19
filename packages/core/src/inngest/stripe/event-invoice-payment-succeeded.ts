import { InvoicePaymentSucceededEvent } from 'src/schemas/stripe/invoice-payment-succeeded'

import {
	CoreInngestFunctionInput,
	CoreInngestHandler,
	CoreInngestTrigger,
} from '../create-inngest-middleware'

export const STRIPE_INVOICE_PAYMENT_SUCCEEDED_EVENT =
	'stripe/invoice-payment-succeeded'

export type StripeInvoicePaymentSucceeded = {
	name: typeof STRIPE_INVOICE_PAYMENT_SUCCEEDED_EVENT
	data: {
		stripeEvent: InvoicePaymentSucceededEvent
	}
}

export const stripeInvoicePaymentSucceededConfig = {
	id: 'stripe-invoice-payment-succeeded',
	name: 'Stripe Invoice Payment Succeeded',
}

export const stripeInvoicePaymentSucceededTrigger: CoreInngestTrigger = {
	event: STRIPE_INVOICE_PAYMENT_SUCCEEDED_EVENT,
}

export const stripeInvoicePaymentSucceededHandler: CoreInngestHandler = async ({
	event,
	step,
	db,
}: CoreInngestFunctionInput) => {
	const invoice = event.data.stripeEvent.data.object

	// Common payment processing for all invoice types
	await step.run('record payment', async () => {
		// TODO: Record payment in our database
		// TODO: Send receipt/confirmation email
		// TODO: Update billing history
	})

	// Handle subscription-specific invoice
	if (invoice.subscription) {
		await step.run('process subscription payment', async () => {
			// TODO: Update subscription payment status
			// TODO: Update subscription renewal date if applicable
			// TODO: Handle subscription-specific notifications
		})
		return
	}

	// Handle one-time payment invoice
	if (invoice.charge) {
		await step.run('process one-time payment', async () => {
			// TODO: Update purchase status if applicable
			// TODO: Handle one-time purchase fulfillment
			// TODO: Send purchase-specific notifications
		})
		return
	}

	// Handle other invoice types (if any)
	await step.run('process other payment type', async () => {
		// TODO: Handle edge cases or unknown payment types
		// TODO: Log for monitoring
	})
}

export const stripeInvoicePaymentSucceeded = {
	config: stripeInvoicePaymentSucceededConfig,
	trigger: stripeInvoicePaymentSucceededTrigger,
	handler: stripeInvoicePaymentSucceededHandler,
}
