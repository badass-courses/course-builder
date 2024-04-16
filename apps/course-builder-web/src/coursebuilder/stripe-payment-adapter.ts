import { env } from '@/env.mjs'
import { add } from 'date-fns'
import Stripe from 'stripe'

import { PaymentsAdapter } from '@coursebuilder/core/providers/stripe'

export class StripePaymentAdapter implements PaymentsAdapter {
	stripe: Stripe

	constructor() {
		this.stripe = new Stripe(env.STRIPE_SECRET_TOKEN, {
			apiVersion: '2020-08-27',
		})
	}

	async getCouponPercentOff(identifier: string) {
		const coupon = await this.stripe.coupons.retrieve(identifier)
		return coupon && coupon.percent_off ? coupon.percent_off / 100 : 0
	}
	async createCoupon(params: Stripe.CouponCreateParams) {
		const coupon = await this.stripe.coupons.create(params)
		return coupon.id
	}
	async createPromotionCode(params: Stripe.PromotionCodeCreateParams) {
		const TWELVE_FOUR_HOURS_FROM_NOW = Math.floor(
			add(new Date(), { hours: 12 }).getTime() / 1000,
		)
		const { id } = await this.stripe.promotionCodes.create(params)
		return id
	}
	async createCheckoutSession(params: Stripe.Checkout.SessionCreateParams) {
		const session = await this.stripe.checkout.sessions.create(params)
		return session.url
	}
	async createCustomer(params: { email: string; userId: string }) {
		const stripeCustomer = await this.stripe.customers.create({
			email: params.email,
			metadata: {
				userId: params.userId,
			},
		})
		return stripeCustomer.id
	}
}
