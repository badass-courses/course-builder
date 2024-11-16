import { z } from 'zod'

export const subscriptionSchema = z.object({
	id: z.string(),
	organizationId: z.string().optional(),
	productId: z.string(),
	createdAt: z.date(),
	merchantSubscriptionId: z.string(),
	status: z.string().default('active'),
	fields: z.record(z.any()).default({}),
})

export type Subscription = z.infer<typeof subscriptionSchema>
