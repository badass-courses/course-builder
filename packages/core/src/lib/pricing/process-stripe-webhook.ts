import Stripe from 'stripe'

import { STRIPE_CHECKOUT_SESSION_COMPLETED_EVENT } from '../../inngest/stripe/event-checkout-session-completed'
import { checkoutSessionCompletedEvent } from '../../schemas/stripe/checkout-session-completed'
import {
	InternalOptions,
	InternalProvider,
	PaymentsProviderConfig,
} from '../../types'
import { sendServerEmail } from '../send-server-email'

const exampleEvent = {
	id: 'evt_1P6e0gAclagrtXef9ybQkT50',
	object: 'event',
	api_version: '2020-08-27',
	created: 1713381550,
	data: {
		object: {
			id: 'cs_test_a1HUHxQCrAdyfBpHFGeL6Rg5gmTWK7f4hN09zB9Bk8cJBtWDLTYZeMCyqP',
			object: 'checkout.session',
			after_expiration: null,
			allow_promotion_codes: null,
			amount_subtotal: 1000,
			amount_total: 1000,
			automatic_tax: { enabled: false, liability: null, status: null },
			billing_address_collection: null,
			cancel_url:
				'https://neatly-diverse-goldfish.ngrok-free.app/checkout-cancel',
			client_reference_id: null,
			client_secret: null,
			consent: null,
			consent_collection: null,
			created: 1713381530,
			currency: 'usd',
			currency_conversion: null,
			custom_fields: [],
			custom_text: {
				after_submit: null,
				shipping_address: null,
				submit: null,
				terms_of_service_acceptance: null,
			},
			customer: 'cus_Pvsd48NJAKWjQ4',
			customer_creation: null,
			customer_details: {
				address: {
					city: null,
					country: 'US',
					line1: null,
					line2: null,
					postal_code: '42424',
					state: null,
				},
				email: 'joelhooks@gmail.com',
				name: '42424',
				phone: null,
				tax_exempt: 'none',
				tax_ids: [],
			},
			customer_email: null,
			expires_at: 1713424729,
			invoice: null,
			invoice_creation: {
				enabled: false,
				invoice_data: {
					account_tax_ids: null,
					custom_fields: null,
					description: null,
					footer: null,
					issuer: null,
					metadata: {},
					rendering_options: null,
				},
			},
			livemode: false,
			locale: null,
			metadata: {
				siteName: 'inngest-gpt',
				userId: '57b0d091-9dfa-4f03-8774-e43f1ec5f3b8',
				country: 'US',
				productId: 'product_cluq5r0jl000008jp20fbfsgs',
				bulk: 'true',
				product: 'Test Event Product',
				ip_address: '',
			},
			mode: 'payment',
			payment_intent: 'pi_3P6e0MAclagrtXef0vs1HBZt',
			payment_link: null,
			payment_method_collection: 'always',
			payment_method_configuration_details: null,
			payment_method_options: { card: { request_three_d_secure: 'automatic' } },
			payment_method_types: ['card'],
			payment_status: 'paid',
			phone_number_collection: { enabled: false },
			recovered_from: null,
			setup_intent: null,
			shipping: null,
			shipping_address_collection: null,
			shipping_options: [],
			shipping_rate: null,
			status: 'complete',
			submit_type: null,
			subscription: null,
			success_url:
				'https://neatly-diverse-goldfish.ngrok-free.app/checkout-success/thanks/purchase?session_id={CHECKOUT_SESSION_ID}&provider=stripe',
			total_details: { amount_discount: 0, amount_shipping: 0, amount_tax: 0 },
			ui_mode: 'hosted',
			url: null,
		},
	},
	livemode: false,
	pending_webhooks: 2,
	request: { id: null, idempotency_key: null },
	type: 'checkout.session.completed',
}

export async function processStripeWebhook(
	event: any,
	options: InternalOptions<'payment'>,
) {
	const stripeProvider: InternalProvider<'payment'> = options.provider
	const stripeAdapter = stripeProvider.options.paymentsAdapter
	const courseBuilderAdapter = options.adapter

	switch (event.type) {
		case 'checkout.session.completed':
			await options.inngest.send({
				name: STRIPE_CHECKOUT_SESSION_COMPLETED_EVENT,
				data: {
					stripeEvent: checkoutSessionCompletedEvent.parse(event),
				},
			})

			break
		case 'charge.refunded':
			console.log('charge.refunded', { event })
			break
		case 'charge.dispute.created':
			console.log('payment_intent.failed', { event })
			break
	}
}
