'use server'

import { revalidatePath } from 'next/cache'
import { stripeProvider } from '@/coursebuilder/stripe-provider'
import { courseBuilderAdapter, db } from '@/db'
import {
	coupon,
	merchantCoupon as merchantCouponTable,
	products,
} from '@/db/schema'
import { env } from '@/env.mjs'
import { getServerAuthSession } from '@/server/auth'
import { log } from '@/server/logger'
import { guid } from '@/utils/guid'
import { and, eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'

import { getCouponForCode } from '@coursebuilder/core/pricing/props-for-commerce'

const CouponInputSchema = z.object({
	quantity: z.string(),
	maxUses: z.coerce.number(),
	expires: z.date().optional(),
	restrictedToProductId: z.string().optional(),
	percentageDiscount: z.string(),
	status: z.number().default(1),
	default: z.boolean().default(false),
	fields: z.record(z.any()).default({}),
})

export type CouponInput = z.infer<typeof CouponInputSchema>

/**
 * Creates a merchant coupon in Stripe and the database if it doesn't exist
 * @param percentageDiscount - The percentage discount as a decimal (e.g., 0.25 for 25%)
 * @returns The merchant coupon ID
 */
async function createOrFindMerchantCoupon(
	percentageDiscount: number,
): Promise<string | null> {
	const percentageForStripe = Math.floor(percentageDiscount * 100)

	// Check for existing merchant coupon first
	const existingMerchantCoupon = await db.query.merchantCoupon.findFirst({
		where: and(
			eq(merchantCouponTable.percentageDiscount, percentageDiscount.toString()),
			eq(merchantCouponTable.type, 'special'),
		),
	})

	if (existingMerchantCoupon) {
		await log.info('coupon.merchant_coupon.found', {
			merchantCouponId: existingMerchantCoupon.id,
			percentageDiscount: percentageDiscount.toString(),
		})
		return existingMerchantCoupon.id
	}

	// Get merchant account for creating new coupon
	const merchantAccountRecord = await courseBuilderAdapter.getMerchantAccount({
		provider: 'stripe',
	})
	if (!merchantAccountRecord) {
		await log.error('coupon.merchant_coupon.no_account', {
			percentageDiscount: percentageDiscount.toString(),
		})
		throw new Error('No merchant account found')
	}

	try {
		// Create the coupon in Stripe (works for any percentage including 100%)
		const stripeCouponId =
			await stripeProvider.options.paymentsAdapter.createCoupon({
				duration: 'forever',
				name: `special ${percentageForStripe}%`,
				percent_off: percentageForStripe,
				metadata: {
					type: 'special',
				},
			})

		// Create the merchant coupon in the database
		const merchantCouponId = `kcd_${uuidv4()}`
		await db.insert(merchantCouponTable).values({
			id: merchantCouponId,
			merchantAccountId: merchantAccountRecord.id,
			status: 1,
			identifier: stripeCouponId,
			percentageDiscount: percentageDiscount.toString(),
			type: 'special',
		})

		await log.info('coupon.merchant_coupon.created', {
			merchantCouponId,
			stripeCouponId,
			percentageDiscount: percentageDiscount.toString(),
		})

		return merchantCouponId
	} catch (error) {
		await log.error('coupon.merchant_coupon.creation_failed', {
			percentageDiscount: percentageDiscount.toString(),
			error: error instanceof Error ? error.message : 'Unknown error',
		})
		throw error
	}
}

export async function createCoupon(input: CouponInput) {
	const { ability } = await getServerAuthSession()
	if (ability.can('create', 'Content')) {
		const percentageDiscount = Number(input.percentageDiscount)

		try {
			// For 100% off coupons, merchantCouponId will be null (no Stripe integration needed)
			const merchantCouponId =
				await createOrFindMerchantCoupon(percentageDiscount)

			const codesArray: string[] = []
			await db.transaction(async (trx) => {
				for (let i = 0; i < Number(input.quantity); i++) {
					const id = `coupon_${guid()}`
					await trx.insert(coupon).values({
						...input,
						merchantCouponId,
						id,
					})
					codesArray.push(id)
				}
			})

			await log.info('coupon.created', {
				quantity: input.quantity,
				percentageDiscount: input.percentageDiscount,
				merchantCouponId: merchantCouponId || 'null_for_100_percent_off',
				couponIds: codesArray,
			})

			revalidatePath('/admin/coupons')
			return codesArray
		} catch (error) {
			await log.error('coupon.creation_failed', {
				reason: 'Exception during coupon creation',
				percentageDiscount: input.percentageDiscount,
				error: error instanceof Error ? error.message : 'Unknown error',
			})
			throw error
		}
	}

	return []
}
/**
 * Returns the loyalty coupon code for the user based on the number of purchases they have made
 * @param purchaseCount - The number of purchases the user has made
 * @returns The loyalty coupon code
 */
function getLoyaltyCouponCode(purchaseCount: number): string | null {
	switch (purchaseCount) {
		case 1:
			return env.COUPON_CODE_LOYALTY_1 || null
		case 2:
			return env.COUPON_CODE_LOYALTY_2 || null
		default:
			return null
	}
}

/**
 * Returns the loyalty coupon for the user based on the number of purchases they have made
 * @param userId - The user's ID
 * @returns The loyalty coupon
 */
export async function getLoyaltyCouponForUser(userId: string) {
	if (!env.COUPON_CODE_LOYALTY_1 || !env.COUPON_CODE_LOYALTY_2) {
		return undefined
	}

	const { getPurchasesForUser } = courseBuilderAdapter

	const userPurchases = await getPurchasesForUser(userId)

	const liveProducts = await db
		.select()
		.from(products)
		.where(eq(products.type, 'live'))

	const liveProductIds = liveProducts.map((product) => product.id)

	const userLiveProductPurchases = userPurchases.filter((purchase) =>
		liveProductIds.includes(purchase.productId),
	)

	const couponCodeForUserWhoPurchasedLiveProduct = getLoyaltyCouponCode(
		userLiveProductPurchases.length,
	)

	const couponFromCode =
		couponCodeForUserWhoPurchasedLiveProduct &&
		(await getCouponForCode(
			couponCodeForUserWhoPurchasedLiveProduct,
			[],
			courseBuilderAdapter,
		))

	if (!couponFromCode) {
		return undefined
	}

	return {
		...couponFromCode,
		default: true,
		status: 1,
	}
}
