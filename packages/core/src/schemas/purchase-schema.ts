import { z } from 'zod'

import { couponSchema } from './coupon-schema'
import { productSchema } from './product-schema'
import { userSchema } from './user-schema'

export const purchaseSchema = z.object({
	id: z.string().max(191),
	userId: z.string().max(191).optional().nullable(),
	createdAt: z.string().default(() => new Date().toISOString()),
	totalAmount: z.string(),
	ipAddress: z.string().max(191).optional().nullable(),
	city: z.string().max(191).optional().nullable(),
	state: z.string().max(191).optional().nullable(),
	country: z.string().max(191).optional().nullable(),
	couponId: z.string().max(191).optional().nullable(),
	productId: z.string().max(191),
	merchantChargeId: z.string().max(191).optional().nullable(),
	upgradedFromId: z.string().max(191).optional().nullable(),
	status: z.string().max(191).default('Valid'),
	bulkCouponId: z.string().max(191).optional().nullable(),
	merchantSessionId: z.string().max(191).optional().nullable(),
	redeemedBulkCouponId: z.string().max(191).optional().nullable(),
	metadata: z.record(z.any()).default({}),
	user: userSchema.optional().nullable(),
	bulkCoupon: couponSchema.optional().nullable(),
	product: productSchema.optional().nullable(),
})

export type Purchase = z.infer<typeof purchaseSchema>
