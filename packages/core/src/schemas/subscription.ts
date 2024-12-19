import { z } from 'zod'

import { MerchantSubscriptionSchema } from './merchant-subscription'
import { productSchema } from './product-schema'

export const SubscriptionSchema = z.object({
	id: z.string(),
	organizationId: z.string().optional(),
	productId: z.string(),
	createdAt: z.date(),
	merchantSubscriptionId: z.string(),
	status: z.string().default('active'),
	fields: z.record(z.any()).default({}),
	product: productSchema,
	merchantSubscription: MerchantSubscriptionSchema.optional(),
})

export type Subscription = z.infer<typeof SubscriptionSchema>
