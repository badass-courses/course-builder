import Stripe from 'stripe'

import { PURCHASE_STATUS_UPDATED_EVENT } from '../../inngest/commerce/event-purchase-status-updated'
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
	api_version: '2024-06-20',
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

const exampleRefundEvent = {
	id: 'evt_3PfrkvCsSasMEpCd0eCwd9JH',
	object: 'event',
	api_version: '2023-10-16',
	created: 1721927689,
	data: {
		object: {
			id: 'ch_3PfrkvCsSasMEpCd0DEIwaHw',
			object: 'charge',
			amount: 29900,
			amount_captured: 29900,
			amount_refunded: 29900,
			application: null,
			application_fee: null,
			application_fee_amount: null,
			balance_transaction: 'txn_3PfrkvCsSasMEpCd0VwSyQPW',
			billing_details: {
				address: [Object],
				email: 'zac+stripe2@egghead.io',
				name: 'zac jones',
				phone: null,
			},
			calculated_statement_descriptor: 'SKILL RECORDINGS INC',
			captured: true,
			created: 1721775892,
			currency: 'usd',
			customer: 'cus_QWvcHlEQa9CjmY',
			description: null,
			destination: null,
			dispute: null,
			disputed: false,
			failure_balance_transaction: null,
			failure_code: null,
			failure_message: null,
			fraud_details: {},
			invoice: null,
			livemode: false,
			metadata: {
				country: 'US',
				productId: 'product-saubh',
				product: 'vbd fundamentals',
				siteName: 'Value-Based Design',
				bulk: 'true',
			},
			on_behalf_of: null,
			order: null,
			outcome: {
				network_status: 'approved_by_network',
				reason: null,
				risk_level: 'normal',
				risk_score: 29,
				seller_message: 'Payment complete.',
				type: 'authorized',
			},
			paid: true,
			payment_intent: 'pi_3PfrkvCsSasMEpCd0buMpotO',
			payment_method: 'pm_1PfrlGCsSasMEpCdrHqXiEVO',
			payment_method_details: { card: [Object], type: 'card' },
			radar_options: {},
			receipt_email: null,
			receipt_number: null,
			receipt_url:
				'https://pay.stripe.com/receipts/payment/CAcaFwoVYWNjdF8xT2dhTGFDc1Nhc01FcENkKIqQirUGMgZ4E9zYBrY6LBZoJZBxV0YFWe5U0wev7bhGuBYwfxLBkQZaUtL_4sibYtrnmm2flohfONHw',
			refunded: true,
			review: null,
			shipping: null,
			source: null,
			source_transfer: null,
			statement_descriptor: null,
			statement_descriptor_suffix: null,
			status: 'succeeded',
			transfer_data: null,
			transfer_group: null,
		},
		previous_attributes: {
			amount_refunded: 0,
			receipt_url:
				'https://pay.stripe.com/receipts/payment/CAcaFwoVYWNjdF8xT2dhTGFDc1Nhc01FcENkKImQirUGMgb8mlBO7cE6LBZs87Bl3MFsTMt5bJxyGQfjUoymQKrjL7F82uaMhXFXmH-kJWwRds68F046',
			refunded: false,
		},
	},
	livemode: false,
	pending_webhooks: 2,
	request: {
		id: 'req_QHie5TSZsMRlfA',
		idempotency_key: 'eb0244bf-48f2-4f9c-b481-a671a19df1d9',
	},
	type: 'charge.refunded',
}

export async function updatePurchaseStatus({
	status,
	stripeChargeId,
	options,
}: {
	options: InternalOptions<'payment'>
	stripeChargeId: string
	status: 'Refunded' | 'Disputed' | 'Banned'
}) {
	await options.inngest.send({
		name: PURCHASE_STATUS_UPDATED_EVENT,
		data: {
			stripeChargeId,
			status,
		},
	})
	const purchase =
		await options.adapter?.getPurchaseForStripeCharge(stripeChargeId)

	if (!purchase) throw new Error('No purchase')

	if (!purchase.merchantChargeId) throw new Error('No merchant charge')

	const merchantCharge = await options.adapter?.getMerchantCharge(
		purchase.merchantChargeId,
	)

	if (!merchantCharge) throw new Error('No merchant charge')

	const merchantChargeId = merchantCharge.id

	return options.adapter?.updatePurchaseStatusForCharge(
		merchantChargeId,
		status,
	)
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
			await updatePurchaseStatus({
				stripeChargeId: event.data.object.id,
				status: 'Refunded',
				options,
			})
			break
		case 'charge.dispute.created':
			await updatePurchaseStatus({
				stripeChargeId: event.data.object.id,
				status: 'Disputed',
				options,
			})
			break
	}
}
