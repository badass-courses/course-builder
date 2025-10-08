import { z } from 'zod'

export const merchantCouponSchema = z
	.object({
		id: z.string().max(191),
		identifier: z.string().max(191).optional().nullable(),
		status: z.number().int().default(0),
		merchantAccountId: z.string().max(191),
		percentageDiscount: z.coerce
			.number()
			.refine((value) => {
				const decimalPlaces = value.toString().split('.')[1]?.length || 0
				return decimalPlaces <= 2
			})
			.optional()
			.nullable(),
		amountDiscount: z.number().int().nonnegative().optional().nullable(),
		type: z.string().max(191),
	})
	.refine(
		(data) => {
			const hasPercentage =
				data.percentageDiscount !== null &&
				data.percentageDiscount !== undefined &&
				data.percentageDiscount > 0
			const hasAmount =
				data.amountDiscount !== null &&
				data.amountDiscount !== undefined &&
				data.amountDiscount > 0
			// Must have either percentage or amount (but not both), OR neither (for inactive coupons)
			return (
				(hasPercentage && !hasAmount) ||
				(!hasPercentage && hasAmount) ||
				(!hasPercentage && !hasAmount)
			)
		},
		{
			message:
				'Cannot have both percentageDiscount and amountDiscount with values > 0',
		},
	)

export type MerchantCoupon = z.infer<typeof merchantCouponSchema>
