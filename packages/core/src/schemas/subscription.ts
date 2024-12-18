import { z } from 'zod'

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
})

export type Subscription = z.infer<typeof SubscriptionSchema>
