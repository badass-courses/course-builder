import { env } from '@/env.mjs'
import Stripe from 'stripe'

import { type PaymentsAdapter } from '@coursebuilder/core/types'
import { logger } from '@coursebuilder/core/utils/logger'

if (!env.STRIPE_SECRET_TOKEN) {
	throw new Error('Stripe secret token not found')
}

const stripe = new Stripe(env.STRIPE_SECRET_TOKEN, {
	apiVersion: '2020-08-27',
})

export class StripePaymentAdapter implements PaymentsAdapter {
	webhookSecret: string

	constructor() {
		if (!env.STRIPE_WEBHOOK_SECRET) {
			throw new Error('Stripe webhook secret not found')
		}
		this.webhookSecret = env.STRIPE_WEBHOOK_SECRET
	}

	async verifyWebhookSignature(rawBody: string, sig: string) {
		const event = stripe.webhooks.constructEvent(
			rawBody,
			sig,
			this.webhookSecret,
		)
		return Boolean(event)
	}

	async getCouponPercentOff(identifier: string) {
		const coupon = await stripe.coupons.retrieve(identifier)
		return coupon && coupon.percent_off ? coupon.percent_off / 100 : 0
	}
	async createCoupon(params: Stripe.CouponCreateParams) {
		const coupon = await stripe.coupons.create(params)
		return coupon.id
	}
	async createPromotionCode(params: Stripe.PromotionCodeCreateParams) {
		const { id } = await stripe.promotionCodes.create(params)
		return id
	}
	async createCheckoutSession(params: Stripe.Checkout.SessionCreateParams) {
		const session = await stripe.checkout.sessions.create(params)
		return session.url
	}

	async getCheckoutSession(checkoutSessionId: string) {
		logger.debug('getCheckoutSession', { checkoutSessionId })
		return await stripe.checkout.sessions.retrieve(checkoutSessionId, {
			expand: [
				'customer',
				'line_items.data.price.product',
				'line_items.data.discounts',
				'payment_intent.latest_charge',
			],
		})
	}
	async createCustomer(params: { email: string; userId: string }) {
		const stripeCustomer = await stripe.customers.create({
			email: params.email,
			metadata: {
				userId: params.userId,
			},
		})
		return stripeCustomer.id
	}
	async getCustomer(customerId: string) {
		return (await stripe.customers.retrieve(customerId)) as Stripe.Customer
	}
	async updateCustomer(
		customerId: string,
		customer: { name: string; email: string },
	) {
		const stripeCustomer = await stripe.customers.update(customerId, {
			name: customer.name,
			email: customer.email,
		})
	}
	async refundCharge(chargeId: string) {
		console.log('refundCharge', { chargeId })
		const refund = await stripe.refunds
			.create({
				charge: chargeId,
			})
			.catch((error) => {
				console.error(error)
				throw error
			})
			.finally(() => {
				console.log('refundCharge FINALLY', { refund })
			})

		console.log('refundCharge', { refund })

		return refund
	}
}
