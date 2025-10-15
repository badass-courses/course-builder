'use server'

import { revalidatePath } from 'next/cache'
import { stripeProvider } from '@/coursebuilder/stripe-provider'
import { courseBuilderAdapter, db } from '@/db'
import { coupon, merchantCoupon as merchantCouponTable } from '@/db/schema'
import { env } from '@/env.mjs'
import { getServerAuthSession } from '@/server/auth'
import { log } from '@/server/logger'
import { guid } from '@/utils/guid'
import { and, eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'

const CouponInputSchema = z.object({
	quantity: z.string(),
	maxUses: z.coerce.number(),
	expires: z.date().optional(),
	restrictedToProductId: z.string().optional(),
	discountType: z.enum(['percentage', 'fixed']).default('percentage'),
	percentageDiscount: z.string().optional(),
	amountDiscount: z.number().optional(),
	status: z.number().default(1),
	default: z.boolean().default(false),
	fields: z.record(z.any()).default({}),
})

export type CouponInput = z.infer<typeof CouponInputSchema>

/**
 * Creates a merchant coupon in Stripe and the database if it doesn't exist (percentage-based)
 * @param percentageDiscount - The percentage discount as a decimal (e.g., 0.25 for 25%)
 * @returns The merchant coupon ID
 */
async function createOrFindMerchantCoupon(
	percentageDiscount: number,
): Promise<string | null> {
	if (percentageDiscount >= 1) {
		return null
	}

	const percentageForStripe = Math.floor(percentageDiscount * 100)

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
		// Create the coupon in Stripe
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
		const merchantCouponId = `ai_${uuidv4()}`
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

/**
 * Creates a fixed discount merchant coupon with Stripe coupon for individual purchases
 * @param amountDiscount - The fixed discount amount in cents (e.g., 2000 for $20)
 * @returns The merchant coupon ID
 */
async function createOrFindFixedMerchantCoupon(
	amountDiscount: number,
): Promise<string | null> {
	if (amountDiscount <= 0) {
		return null
	}

	const existingMerchantCoupon = await db.query.merchantCoupon.findFirst({
		where: and(
			eq(merchantCouponTable.amountDiscount, amountDiscount),
			eq(merchantCouponTable.type, 'special'),
		),
	})

	if (existingMerchantCoupon) {
		await log.info('coupon.merchant_coupon_fixed.found', {
			merchantCouponId: existingMerchantCoupon.id,
			amountDiscount,
		})
		return existingMerchantCoupon.id
	}

	const merchantAccountRecord = await courseBuilderAdapter.getMerchantAccount({
		provider: 'stripe',
	})
	if (!merchantAccountRecord) {
		await log.error('coupon.merchant_coupon_fixed.no_account', {
			amountDiscount,
		})
		throw new Error('No merchant account found')
	}

	try {
		// Create the Stripe coupon for individual purchases
		// For bulk purchases, a new transient coupon will be created at checkout
		const stripeCouponId =
			await stripeProvider.options.paymentsAdapter.createCoupon({
				duration: 'forever',
				name: `special $${(amountDiscount / 100).toFixed(2)}`,
				amount_off: amountDiscount,
				currency: 'USD',
				metadata: {
					type: 'special',
				},
			})

		// Create the merchant coupon in the database
		const merchantCouponId = `ai_${uuidv4()}`
		await db.insert(merchantCouponTable).values({
			id: merchantCouponId,
			merchantAccountId: merchantAccountRecord.id,
			status: 1,
			identifier: stripeCouponId,
			amountDiscount,
			type: 'special',
		})

		await log.info('coupon.merchant_coupon_fixed.created', {
			merchantCouponId,
			stripeCouponId,
			amountDiscount,
		})

		return merchantCouponId
	} catch (error) {
		await log.error('coupon.merchant_coupon_fixed.creation_failed', {
			amountDiscount,
			error: error instanceof Error ? error.message : 'Unknown error',
		})
		throw error
	}
}

export async function createCoupon(input: CouponInput) {
	const { ability } = await getServerAuthSession()
	if (ability.can('create', 'Content')) {
		let merchantCouponId: string | null = null

		// Create or find merchant coupon based on discount type
		if (input.discountType === 'percentage' && input.percentageDiscount) {
			const percentageDiscount = Number(input.percentageDiscount)
			merchantCouponId = await createOrFindMerchantCoupon(percentageDiscount)
		} else if (input.discountType === 'fixed' && input.amountDiscount) {
			merchantCouponId = await createOrFindFixedMerchantCoupon(
				input.amountDiscount,
			)
		} else {
			throw new Error(
				'Invalid discount configuration: must provide either percentageDiscount or amountDiscount',
			)
		}

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
			discountType: input.discountType,
			percentageDiscount: input.percentageDiscount,
			amountDiscount: input.amountDiscount,
			merchantCouponId,
			couponIds: codesArray,
		})

		revalidatePath('/admin/coupons')
		return codesArray
	}

	return []
}
