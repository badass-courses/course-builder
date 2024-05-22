'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { coupon } from '@/db/schema'
import { getServerAuthSession } from '@/server/auth'
import { guid } from '@/utils/guid'
import { z } from 'zod'

const CouponInputSchema = z.object({
	quantity: z.string(),
	maxUses: z.coerce.number(),
	expires: z.date().optional(),
	restrictedToProductId: z.string().optional(),
	percentageDiscount: z.string(),
})

export type CouponInput = z.infer<typeof CouponInputSchema>

export async function createCoupon(input: CouponInput) {
	const { ability } = await getServerAuthSession()
	if (ability.can('create', 'Content')) {
		await db.insert(coupon).values({
			...input,
			id: `coupon_${guid()}`,
		})

		revalidatePath('/admin/coupons')
	}
}
