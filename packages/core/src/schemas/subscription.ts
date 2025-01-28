import { z } from 'zod'

import { MerchantSubscriptionSchema } from './merchant-subscription'
import { productSchema } from './product-schema'

export const SubscriptionSchema = z.object({
	id: z.string(),
	organizationId: z.string().optional(),
	productId: z.string(),
	createdAt: z.coerce.date(),
	merchantSubscriptionId: z.string(),
	status: z
		.enum([
			'incomplete',
			'incomplete_expired',
			'trialing',
			'active',
			'past_due',
			'canceled',
			'unpaid',
			'paused',
		])
		.default('active'),
	fields: z.record(z.any()).default({}),
	product: productSchema,
	merchantSubscription: MerchantSubscriptionSchema.optional(),
})

export type Subscription = z.infer<typeof SubscriptionSchema>
