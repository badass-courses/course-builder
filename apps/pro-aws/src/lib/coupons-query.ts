'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { coupon, merchantCoupon as merchantCouponTable } from '@/db/schema'
import { getServerAuthSession } from '@/server/auth'
import { guid } from '@/utils/guid'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

const CouponInputSchema = z.object({
	quantity: z.string(),
	maxUses: z.coerce.number(),
	expires: z.date().optional(),
	restrictedToProductId: z.string().optional(),
	percentageDiscount: z.string(),
})

const findClosestDiscount = function (percentOff: number) {
	// we want a fraction so if it is whole number, we make it fractional
	percentOff = percentOff <= 1 ? percentOff : percentOff / 100
	return [1, 0.95, 0.9, 0.75, 0.6, 0.5, 0.4, 0.25, 0.1].reduce((a, b) => {
		let aDiff = Math.abs(a - percentOff)
		let bDiff = Math.abs(b - percentOff)

		if (aDiff === bDiff) {
			// Choose largest vs smallest (> vs <)
			return a > b ? a : b
		} else {
			return bDiff < aDiff ? b : a
		}
	})
}

export type CouponInput = z.infer<typeof CouponInputSchema>

export async function createCoupon(input: CouponInput) {
	const { ability } = await getServerAuthSession()
	if (ability.can('create', 'Content')) {
		const percentageDiscount = findClosestDiscount(
			Number(input.percentageDiscount) * 100,
		)

		const merchantCoupon =
			percentageDiscount < 1
				? await db.query.merchantCoupon.findFirst({
						where: and(
							eq(
								merchantCouponTable.percentageDiscount,
								percentageDiscount.toString(),
							),
							eq(merchantCouponTable.type, 'special'),
						),
					})
				: null

		if (!merchantCoupon) {
			throw new Error('No coupon found')
		}

		await db.insert(coupon).values({
			...input,
			merchantCouponId: merchantCoupon?.id,
			id: `coupon_${guid()}`,
		})

		revalidatePath('/admin/coupons')
	}
}
