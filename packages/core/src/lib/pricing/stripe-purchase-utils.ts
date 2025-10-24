import { CourseBuilderAdapter } from 'src/adapters'
import { Purchase } from 'src/schemas'
import {
	PurchaseInfo,
	PurchaseInfoSchema,
	PurchaseMetadata,
} from 'src/schemas/purchase-info'
import {
	EXISTING_BULK_COUPON,
	INDIVIDUAL_TO_BULK_UPGRADE,
	NEW_BULK_COUPON,
	NEW_INDIVIDUAL_PURCHASE,
	PurchaseType,
} from 'src/schemas/purchase-type'
import Stripe from 'stripe'

import { first, isEmpty, sortBy } from '@coursebuilder/nodash'

export async function parsePurchaseInfoFromCheckoutSession(
	checkoutSession: Stripe.Checkout.Session,
	courseBuilderAdapter: CourseBuilderAdapter,
): Promise<PurchaseInfo> {
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
		console.log('Debug - userId:', userId)

		const checkoutSessionPurchase =
			await getPurchaseForStripeCharge(chargeIdentifier)
		console.log('Debug - checkoutSessionPurchase:', checkoutSessionPurchase)

		if (!userId || !checkoutSessionPurchase?.id) {
			console.log('Debug - Missing data, throwing error')
			throw new Error('Missing userId or purchase for checkout session')
		}

		const allUserPurchases = await getPurchasesForUser(userId)
		console.log('Debug - allUserPurchases:', allUserPurchases)

		const { type, data } = summarizePurchases(
			checkoutSessionPurchase,
			allUserPurchases,
		)
		console.log('Debug - summarized type:', type)
		console.log('Debug - summarized data:', data)

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

		return NEW_INDIVIDUAL_PURCHASE
	} catch (e) {
		console.error('Error in determinePurchaseType:', e)
		return NEW_INDIVIDUAL_PURCHASE
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

		// If there are no team bulk purchases, this is chronologically first
		const focalBulkPurchaseIsChronologicallyFirst =
			isEmpty(teamBulkPurchases) ||
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
