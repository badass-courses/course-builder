import { first, isEmpty, sortBy } from 'lodash'
import Stripe from 'stripe'
import { z } from 'zod'

import { CourseBuilderAdapter } from '../../adapters'
import { Purchase, User } from '../../schemas'
import { CheckoutSessionCompletedEvent } from '../../schemas/stripe/checkout-session-completed'
import {
	CoreInngestFunctionInput,
	CoreInngestHandler,
	CoreInngestTrigger,
} from '../create-inngest-middleware'

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

export const EXISTING_BULK_COUPON = 'EXISTING_BULK_COUPON'
export const NEW_BULK_COUPON = 'NEW_BULK_COUPON'
export const NEW_INDIVIDUAL_PURCHASE = 'NEW_INDIVIDUAL_PURCHASE'
export const INDIVIDUAL_TO_BULK_UPGRADE = 'INDIVIDUAL_TO_BULK_UPGRADE'

export const purchaseTypeSchema = z.union([
	z.literal(EXISTING_BULK_COUPON),
	z.literal(NEW_BULK_COUPON),
	z.literal(NEW_INDIVIDUAL_PURCHASE),
	z.literal(INDIVIDUAL_TO_BULK_UPGRADE),
])
export type PurchaseType = z.infer<typeof purchaseTypeSchema>

export const PurchaseMetadata = z.object({
	country: z.string().optional(),
	appliedPPPStripeCouponId: z.string().optional(), // TODO: make this provider agnostic
	upgradedFromPurchaseId: z.string().optional(),
	usedCouponId: z.string().optional(),
})

export const PurchaseInfoSchema = z.object({
	customerIdentifier: z.string(),
	email: z.string().nullable(),
	name: z.string().nullable(),
	productIdentifier: z.string(),
	product: z.object({ name: z.string().nullable() }), // TODO: does this need to surface any other values?
	chargeIdentifier: z.string(),
	couponIdentifier: z.string().optional(),
	quantity: z.number(),
	chargeAmount: z.number(),
	metadata: PurchaseMetadata.passthrough().optional(),
	purchaseType: purchaseTypeSchema,
})
export type PurchaseInfo = z.infer<typeof PurchaseInfoSchema>

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

async function parseCheckoutSession(
	checkoutSession: any,
	courseBuilderAdapter: CourseBuilderAdapter,
) {
	const { customer, line_items, payment_intent, metadata } = checkoutSession
	const { email, name, id: stripeCustomerId } = customer as Stripe.Customer
	const lineItem = first(line_items?.data) as Stripe.LineItem
	const stripePrice = lineItem.price
	const quantity = lineItem.quantity || 1
	const stripeProduct = stripePrice?.product as Stripe.Product
	const { charges } = payment_intent as Stripe.PaymentIntent
	const stripeCharge = first<Stripe.Charge>(charges.data)
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

export const stripeCheckoutSessionCompletedHandler: CoreInngestHandler =
	async ({
		event,
		step,
		db,
		siteRootUrl,
		paymentProvider,
	}: CoreInngestFunctionInput) => {
		// break down the checkout session into the info we need

		// recordNewPurchase(event.data.object.id)
		// 	getPurchaseInfo - load the details of the purchase from stripe
		//  find or create a user
		//  load the merchant product from the database
		//  find or create the merchant customer in the database
		//  create a merchant charge and purchase in the database

		const stripeEvent = event.data.stripeEvent
		const paymentsAdapter = paymentProvider.options.paymentsAdapter
		const stripeCheckoutSession = stripeEvent.data.object

		const merchantAccount = await step.run(
			'load the merchant account',
			async () => {
				return await db.getMerchantAccount({
					provider: 'stripe',
				})
			},
		)

		if (!merchantAccount) {
			throw new Error('Merchant account not found')
		}

		const checkoutSession = await step.run(
			'get stripe checkout session',
			async () => {
				return await paymentsAdapter.getCheckoutSession(
					stripeCheckoutSession.id,
				)
			},
		)

		const purchaseInfo = await step.run('parse checkout session', async () => {
			return await parseCheckoutSession(checkoutSession, db)
		})

		const { user, isNewUser } = await step.run('load the user', async () => {
			if (!purchaseInfo.email) {
				throw new Error('purchaseInfo.email is null')
			}
			return await db.findOrCreateUser(purchaseInfo.email)
		})

		const merchantProduct = await step.run(
			'load the merchant product',
			async () => {
				return await db.getMerchantProduct(purchaseInfo.productIdentifier)
			},
		)

		const merchantCustomer = await step.run(
			'load the merchant customer',
			async () => {
				return await db.findOrCreateMerchantCustomer({
					user: user as User,
					identifier: purchaseInfo.customerIdentifier,
					merchantAccountId: merchantAccount.id,
				})
			},
		)

		return await step.run('create a merchant charge and purchase', async () => {
			if (!merchantProduct) {
				throw new Error('merchantProduct is null')
			}
			if (!merchantCustomer) {
				throw new Error('merchantCustomer is null')
			}
			return await db.createMerchantChargeAndPurchase({
				userId: user.id,
				productId: merchantProduct.productId,
				stripeChargeId: purchaseInfo.chargeIdentifier,
				stripeCouponId: purchaseInfo.couponIdentifier,
				merchantAccountId: merchantAccount.id,
				merchantProductId: merchantProduct.id,
				merchantCustomerId: merchantCustomer.id,
				stripeChargeAmount: purchaseInfo.chargeAmount,
				quantity: purchaseInfo.quantity,
				checkoutSessionId: stripeCheckoutSession.id,
				country: purchaseInfo.metadata?.country,
				appliedPPPStripeCouponId:
					purchaseInfo.metadata?.appliedPPPStripeCouponId,
				upgradedFromPurchaseId: purchaseInfo.metadata?.upgradedFromPurchaseId,
				usedCouponId: purchaseInfo.metadata?.usedCouponId,
			})
		})
	}
