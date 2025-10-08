import { parseSubscriptionInfoFromCheckoutSession } from 'src/lib/pricing/stripe-subscription-utils'
import Stripe from 'stripe'

import { CourseBuilderAdapter } from '../adapters'
import { CheckoutParams, stripeCheckout } from '../lib/pricing/stripe-checkout'
import { parsePurchaseInfoFromCheckoutSession } from '../lib/pricing/stripe-purchase-utils'
import { logger } from '../lib/utils/logger'
import {
	PaymentsAdapter,
	PaymentsProviderConfig,
	PaymentsProviderConsumerConfig,
} from '../types'

export default function StripeProvider(
	options: PaymentsProviderConsumerConfig,
): PaymentsProviderConfig {
	return {
		id: 'stripe',
		name: 'Stripe',
		type: 'payment',
		...options,
		options,
		getSubscription: async (subscriptionId: string) => {
			return options.paymentsAdapter.getSubscription(subscriptionId)
		},
		getBillingPortalUrl: async (customerId: string, returnUrl: string) => {
			return options.paymentsAdapter.getBillingPortalUrl(customerId, returnUrl)
		},
		getSubscriptionInfo: async (
			checkoutSessionId: string,
			_: CourseBuilderAdapter,
		) => {
			const checkoutSession =
				await options.paymentsAdapter.getCheckoutSession(checkoutSessionId)
			console.log('checkoutSession', checkoutSession)

			return parseSubscriptionInfoFromCheckoutSession(checkoutSession)
		},
		getPurchaseInfo: async (
			checkoutSessionId: string,
			adapter: CourseBuilderAdapter,
		) => {
			const checkoutSession =
				await options.paymentsAdapter.getCheckoutSession(checkoutSessionId)
			return parsePurchaseInfoFromCheckoutSession(checkoutSession, adapter)
		},
		createCheckoutSession: async (
			checkoutParams: CheckoutParams,
			adapter?: CourseBuilderAdapter,
		) => {
			return stripeCheckout({
				params: checkoutParams,
				config: options,
				adapter,
			})
		},
		getCustomer: async (customerId: string) => {
			return options.paymentsAdapter.getCustomer(customerId)
		},
		updateCustomer: async (
			customerId: string,
			customer: { name: string; email: string; metadata?: Record<string, any> },
		) => {
			return options.paymentsAdapter.updateCustomer(customerId, customer)
		},
		refundCharge: async (chargeId: string) => {
			return options.paymentsAdapter.refundCharge(chargeId)
		},
		getProduct: async (productId: string) => {
			return options.paymentsAdapter.getProduct(productId)
		},
		getPrice: async (priceId: string) => {
			return options.paymentsAdapter.getPrice(priceId)
		},
		updateProduct: async (
			productId: string,
			product: Partial<Stripe.Product>,
		) => {
			return options.paymentsAdapter.updateProduct(productId, product)
		},
		updatePrice: async (priceId: string, price: Partial<Stripe.Price>) => {
			return options.paymentsAdapter.updatePrice(priceId, price)
		},
		createPrice: async (price: Stripe.PriceCreateParams) => {
			return options.paymentsAdapter.createPrice(price)
		},
		createProduct: async (product: Stripe.ProductCreateParams) => {
			return options.paymentsAdapter.createProduct(product)
		},
	}
}

export const STRIPE_VERSION = '2024-06-20'

export class StripePaymentAdapter implements PaymentsAdapter {
	webhookSecret: string
	stripe: Stripe

	constructor({
		stripeToken,
		stripeWebhookSecret,
	}: {
		stripeToken: string
		stripeWebhookSecret: string
	}) {
		const stripe = this.createStripeClient(stripeToken)

		if (!stripeWebhookSecret) {
			throw new Error('Stripe webhook secret not found')
		}
		this.webhookSecret = stripeWebhookSecret
		this.stripe = stripe
	}

	private createStripeClient(token: string) {
		return new Stripe(token, {
			apiVersion: STRIPE_VERSION,
		})
	}

	async verifyWebhookSignature(rawBody: string, sig: string) {
		const event = this.stripe.webhooks.constructEvent(
			rawBody,
			sig,
			this.webhookSecret,
		)
		return Boolean(event)
	}

	async getCouponPercentOff(identifier: string) {
		const coupon = await this.stripe.coupons.retrieve(identifier)
		return coupon && coupon.percent_off ? coupon.percent_off / 100 : 0
	}

	async getCouponAmountOff(identifier: string) {
		const coupon = await this.stripe.coupons.retrieve(identifier)
		return coupon && coupon.amount_off ? coupon.amount_off : 0
	}

	async createCoupon(params: Stripe.CouponCreateParams) {
		const coupon = await this.stripe.coupons.create(params)
		return coupon.id
	}
	async createPromotionCode(params: Stripe.PromotionCodeCreateParams) {
		const { id } = await this.stripe.promotionCodes.create(params)
		return id
	}
	async createCheckoutSession(params: Stripe.Checkout.SessionCreateParams) {
		const session = await this.stripe.checkout.sessions.create(params)
		return session.url
	}

	async getCheckoutSession(checkoutSessionId: string) {
		logger.debug('getCheckoutSession', { checkoutSessionId })
		return await this.stripe.checkout.sessions.retrieve(checkoutSessionId, {
			expand: [
				'customer',
				'line_items.data.price.product',
				'line_items.data.discounts',
				'payment_intent.latest_charge',
				'subscription',
				'subscription.plan.product',
			],
		})
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
	async getCustomer(customerId: string) {
		return (await this.stripe.customers.retrieve(customerId)) as Stripe.Customer
	}
	async updateCustomer(
		customerId: string,
		customer: { name: string; email: string; metadata: Record<string, string> },
	) {
		const stripeCustomer = (await this.stripe.customers.retrieve(
			customerId,
		)) as Stripe.Customer

		await this.stripe.customers.update(customerId, {
			name: customer.name || stripeCustomer.name || undefined,
			email: customer.email || stripeCustomer.email || undefined,
			metadata: {
				...stripeCustomer.metadata,
				...customer.metadata,
			},
		})
	}
	async refundCharge(chargeId: string) {
		return await this.stripe.refunds.create({
			charge: chargeId,
		})
	}
	async getProduct(productId: string) {
		return this.stripe.products.retrieve(productId)
	}
	async getPrice(priceId: string) {
		return this.stripe.prices.retrieve(priceId)
	}

	async updateProduct<TProductUpdate = Stripe.ProductUpdateParams>(
		productId: string,
		product: Partial<TProductUpdate>,
	) {
		await this.stripe.products.update(productId, product)
	}
	async updatePrice<TPriceUpdate = Stripe.PriceUpdateParams>(
		priceId: string,
		price: Partial<TPriceUpdate>,
	) {
		await this.stripe.prices.update(priceId, price)
	}
	async createPrice(price: Stripe.PriceCreateParams) {
		return this.stripe.prices.create(price)
	}
	async createProduct(product: Stripe.ProductCreateParams) {
		return this.stripe.products.create(product)
	}
	async getSubscription(subscriptionId: string) {
		return this.stripe.subscriptions.retrieve(subscriptionId)
	}
	async getBillingPortalUrl(customerId: string, returnUrl: string) {
		return this.stripe.billingPortal.sessions
			.create({
				customer: customerId,
				return_url: returnUrl,
			})
			.then((session) => session.url)
	}
}

export const mockStripeAdapter: PaymentsAdapter = {
	getCouponPercentOff: async () => 0,
	getCouponAmountOff: async () => 0,
	createCoupon: async () => 'mock-coupon-id',
	createPromotionCode: async () => 'mock-promotion-code-id',
	createCheckoutSession: async () => 'mock-checkout-session-id',
	createCustomer: async () => 'mock-customer-id',
	verifyWebhookSignature: async () => true,
	getCheckoutSession: async () => ({ id: 'mock-checkout-session-id' }) as any,
	getCustomer: async () => ({ id: 'mock-customer-id' }) as any,
	updateCustomer: async () => {},
	refundCharge: async () => ({}) as any,
	updateProduct: async () => {},
	updatePrice: async () => {},
	getProduct: async () => ({}) as any,
	getPrice: async () => ({}) as any,
	createPrice: async () => ({}) as any,
	createProduct: async () => ({}) as any,
	getSubscription: async () => ({}) as any,
	getBillingPortalUrl: async () => 'mock-billing-portal-url',
}

export const MockStripeProvider: PaymentsProviderConfig = {
	id: 'mock-stripe' as const,
	name: 'Mock Stripe',
	type: 'payment',
	options: {
		errorRedirectUrl: 'mock-error-redirect-url',
		cancelUrl: 'mock-cancel-url',
		baseSuccessUrl: 'mock-base-success-url',
		paymentsAdapter: mockStripeAdapter,
	},
	getSubscriptionInfo: async () => ({}) as any,
	getPurchaseInfo: async (
		checkoutSessionId: string,
		adapter: CourseBuilderAdapter,
	) => {
		return {} as any
	},
	createCheckoutSession: async () => {
		return {
			redirect: 'mock-checkout-session-id',
			status: 303,
		}
	},
	getCustomer: async () => ({ id: 'mock-customer-id' }) as any,
	updateCustomer: async () => {},
	refundCharge: async () => ({}) as any,
	updateProduct: async () => {},
	updatePrice: async () => {},
	getProduct: async () => ({}) as any,
	getPrice: async () => ({}) as any,
	createPrice: async () => ({}) as any,
	createProduct: async () => ({}) as any,
	getSubscription: async () => ({}) as any,
	getBillingPortalUrl: async () => 'mock-billing-portal-url',
}
