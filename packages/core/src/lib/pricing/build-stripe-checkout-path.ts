import { z } from 'zod'

import { isNil, omitBy } from '@coursebuilder/nodash'

const ParamsSchema = z
	.object({
		productId: z.string().optional(),
		couponId: z.string().optional(),
		bulk: z.boolean(),
		quantity: z.number().default(1),
		userId: z.string().optional(),
		upgradeFromPurchaseId: z.string().optional(),
		cancelUrl: z.string().optional(),
		usedCouponId: z.string().optional(),
		errorRedirectUrl: z.string().optional(),
		organizationId: z.string().optional(),
	})
	.transform((params) => {
		return {
			...params,
			bulk: Boolean(params.bulk).toString(),
			productId: params.productId || '',
			quantity: String(params.quantity),
		}
	})

type Params = z.input<typeof ParamsSchema>

export const buildStripeCheckoutPath = (params: Params) => {
	const result = ParamsSchema.safeParse(params)

	if (result.success) {
		const queryParams = omitBy(result.data, isNil)
		const queryParamString = new URLSearchParams(queryParams).toString()
		return `/api/coursebuilder/checkout/stripe?${queryParamString}`
	}

	// fallback, report to Sentry?
	return `/api/coursebuilder/checkout/stripe?productId=${params.productId}`
}
