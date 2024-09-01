import first from 'lodash/first'
import isEmpty from 'lodash/isEmpty'
import sortBy from 'lodash/sortBy'
import Stripe from 'stripe'
import * as stripe from 'stripe'

import type { PaymentsAdapter } from '../../dist/types'
import { CourseBuilderAdapter } from '../adapters'
import { CheckoutParams, stripeCheckout } from '../lib/pricing/stripe-checkout'
import { logger } from '../lib/utils/logger'
import { Purchase } from '../schemas'
import {
	PurchaseInfo,
	PurchaseInfoSchema,
	PurchaseMetadata,
} from '../schemas/purchase-info'
import {
	EXISTING_BULK_COUPON,
	INDIVIDUAL_TO_BULK_UPGRADE,
	NEW_BULK_COUPON,
	NEW_INDIVIDUAL_PURCHASE,
	PurchaseType,
} from '../schemas/purchase-type'
import {
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
		getPurchaseInfo: async (
			checkoutSessionId: string,
			adapter: CourseBuilderAdapter,
		) => {
			const checkoutSession =
				await options.paymentsAdapter.getCheckoutSession(checkoutSessionId)
			return parseCheckoutSession(checkoutSession, adapter)
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
			customer: { name: string; email: string },
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
		customer: { name: string; email: string },
	) {
		const stripeCustomer = await this.stripe.customers.update(customerId, {
			name: customer.name,
			email: customer.email,
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
}

export const MockStripeProvider: PaymentsProviderConfig = {
	id: 'mock-stripe' as const,
	name: 'Mock Stripe',
	type: 'payment',
	options: {
		errorRedirectUrl: 'mock-error-redirect-url',
		cancelUrl: 'mock-cancel-url',
		baseSuccessUrl: 'mock-base-success-url',
		paymentsAdapter: {
			getCouponPercentOff: async () => 0,
			createCoupon: async () => 'mock-coupon-id',
			createPromotionCode: async () => 'mock-promotion-code-id',
			createCheckoutSession: async () => 'mock-checkout-session-id',
			createCustomer: async () => 'mock-customer-id',
			verifyWebhookSignature: async () => true,
			getCheckoutSession: async () =>
				({ id: 'mock-checkout-session-id' }) as any,
			getCustomer: async () => ({ id: 'mock-customer-id' }) as any,
			updateCustomer: async () => {},
			refundCharge: async () => ({}) as any,
			updateProduct: async () => {},
			updatePrice: async () => {},
			getProduct: async () => ({}) as any,
			getPrice: async () => ({}) as any,
			createPrice: async () => ({}) as any,
			createProduct: async () => ({}) as any,
		},
	},
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
}

type DeterminePurchaseTypeOptions = {
	chargeIdentifier: string
	email: string | null
	courseBuilderAdapter: CourseBuilderAdapter
}

export async function determinePurchaseType(
	options: DeterminePurchaseTypeOptions,
): Promise<PurchaseType> {
	const { email, chargeIdentifier, courseBuilderAdapter } = options

	const { getUserByEmail, getPurchasesForUser, getPurchaseForStripeCharge } =
		courseBuilderAdapter

	try {
		const user = !!email && (await getUserByEmail?.(email))
		const { id: userId } = user || {}

		// Find the purchase record associated with this Stripe Checkout Session
		// (via the `stripeChargeId`).
		const checkoutSessionPurchase =
			await getPurchaseForStripeCharge(chargeIdentifier)

		// return early if we don't have a userId or a purchase corresponding to
		// this checkout session
		if (!userId || !checkoutSessionPurchase?.id)
			throw new Error('Missing userId or purchase for checkout session')

		const allUserPurchases = await getPurchasesForUser(userId)

		const { type, data } = summarizePurchases(
			checkoutSessionPurchase,
			allUserPurchases,
		)

		if (type === 'BULK') {
			const {
				otherTeamBulkPurchases,
				otherIndividualPurchases,
				focalBulkPurchaseIsChronologicallyFirst,
			} = data.focalProduct

			if (
				isEmpty(otherTeamBulkPurchases) ||
				focalBulkPurchaseIsChronologicallyFirst
			) {
				if (isEmpty(otherIndividualPurchases)) {
					// this is the first purchase, it is a new bulk coupon purchase
					return NEW_BULK_COUPON
				} else {
					// they made an individual purchase before, but are now purchasing
					// a bulk coupon, that's an upgrade to bulk
					return INDIVIDUAL_TO_BULK_UPGRADE
				}
			} else {
				// anything else at this point is a purchase of additional bulk seats
				return EXISTING_BULK_COUPON
			}
		}

		// if we've fallen through to here, we are dealing with an individual purchase
		//
		// there are more specific types of individual purchases:
		// - standard individual
		// - upgrade individual
		// - redemption
		//
		// but we'll just treat all of these as NEW_INDIVIDUAL_PURCHASE for now
		return NEW_INDIVIDUAL_PURCHASE
	} catch (e) {
		// Report this to Sentry
		return NEW_INDIVIDUAL_PURCHASE
	}
}

export async function parseCheckoutSession(
	checkoutSession: Stripe.Checkout.Session,
	courseBuilderAdapter: CourseBuilderAdapter,
) {
	const { customer, line_items, payment_intent, metadata } = checkoutSession
	const { email, name, id: stripeCustomerId } = customer as Stripe.Customer
	const lineItem = first(line_items?.data) as Stripe.LineItem
	const stripePrice = lineItem.price
	const quantity = lineItem.quantity || 1
	const stripeProduct = stripePrice?.product as Stripe.Product
	const { latest_charge } = payment_intent as Stripe.PaymentIntent

	let stripeCharge: Stripe.Charge = latest_charge as Stripe.Charge

	const stripeChargeId = stripeCharge?.id as string
	const stripeChargeAmount = stripeCharge?.amount || 0

	const discount = first(lineItem.discounts)
	const stripeCouponId = discount?.discount.coupon.id

	const parsedMetadata = metadata ? PurchaseMetadata.parse(metadata) : undefined

	const purchaseType = await determinePurchaseType({
		chargeIdentifier: stripeChargeId,
		email,
		courseBuilderAdapter,
	})

	const info: PurchaseInfo = {
		customerIdentifier: stripeCustomerId,
		email,
		name,
		productIdentifier: stripeProduct.id,
		product: stripeProduct,
		chargeIdentifier: stripeChargeId,
		couponIdentifier: stripeCouponId,
		quantity,
		chargeAmount: stripeChargeAmount,
		metadata: parsedMetadata,
		purchaseType,
	}

	return PurchaseInfoSchema.parse(info)
}

/**
 * Check that two values match without matching on two undefined values
 *
 * This is helpful when you find yourself doing a comparison like
 * `obj?.a === obj?.b`. If both values are undefined, then it resolves to
 * true. If you don't want that, then you have to guard the comparison,
 * `obj?.a && obj?.b && obj?.a === obj?.b`. This function takes care of that.
 */
const match = (
	value1: string | number | undefined,
	value2: string | number | undefined,
) => {
	return Boolean(value1 && value2 && value1 === value2)
}

type PurchaseForStripeCharge = NonNullable<Awaited<Promise<Purchase | null>>>
type StripePurchase = Awaited<Promise<Purchase[]>>[number]
type BulkCoupon = NonNullable<Pick<StripePurchase, 'bulkCoupon'>['bulkCoupon']>
type BulkPurchase = StripePurchase & { bulkCoupon: BulkCoupon }
type BulkPurchaseData = {
	focalProduct: {
		productId: string
		focalPurchase: PurchaseForStripeCharge
		otherTeamBulkPurchases: BulkPurchase[]
		otherIndividualPurchases: StripePurchase[]
		focalBulkPurchaseIsChronologicallyFirst: boolean
	}
}
type IndividualPurchaseData = {
	focalProduct: {
		productId: string
		focalPurchase: PurchaseForStripeCharge
		otherIndividualPurchases: StripePurchase[]
	}
}

const summarizePurchases = (
	focalPurchase: PurchaseForStripeCharge,
	allUserPurchases: StripePurchase[],
):
	| { type: 'BULK'; data: BulkPurchaseData }
	| { type: 'INDIVIDUAL'; data: IndividualPurchaseData } => {
	// summarize only purchases whose productId's match the focal
	// purchase's productId
	const focalProductId = focalPurchase.productId

	const purchaseIsBulk = Boolean(focalPurchase.bulkCoupon?.id)

	// Summarize the purchases for this product ID
	const focalProductPurchases = allUserPurchases.filter(
		(purchase) => purchase.productId === focalProductId,
	)

	const bulkPurchases = focalProductPurchases.filter(
		(purchase): purchase is BulkPurchase => Boolean(purchase.bulkCoupon?.id),
	)

	const otherIndividualPurchases = focalProductPurchases.filter(
		(purchase) =>
			isEmpty(purchase.bulkCoupon) &&
			isEmpty(purchase.redeemedBulkCouponId) &&
			purchase.id !== focalPurchase.id,
	)

	if (purchaseIsBulk) {
		const teamBulkPurchases = bulkPurchases.filter((purchase) =>
			match(purchase.bulkCoupon.id, focalPurchase.bulkCoupon?.id),
		)
		const otherTeamBulkPurchases = teamBulkPurchases.filter(
			(purchase) => purchase.id !== focalPurchase.id,
		)

		const focalBulkPurchaseIsChronologicallyFirst =
			sortBy(teamBulkPurchases, 'createdAt')[0].id === focalPurchase.id

		return {
			type: 'BULK',
			data: {
				focalProduct: {
					productId: focalProductId,
					focalPurchase,
					otherTeamBulkPurchases,
					otherIndividualPurchases,
					focalBulkPurchaseIsChronologicallyFirst,
				},
				// data creates a bag where we can return summaries of purchases
				// for other products, etc.
			},
		}
	} else {
		return {
			type: 'INDIVIDUAL',
			data: {
				focalProduct: {
					productId: focalProductId,
					focalPurchase,
					otherIndividualPurchases,
				},
			},
		}
	}
}
