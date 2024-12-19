import { z } from 'zod'

export const MerchantSubscriptionSchema = z.object({
	id: z.string(),
	organizationId: z.string().nullable(),
	merchantAccountId: z.string(),
	status: z.number().default(0),
	createdAt: z.date().default(() => new Date()),
	label: z.string().nullable(),
	identifier: z.string().nullable(),
	merchantCustomerId: z.string(),
	merchantProductId: z.string(),
})

export type MerchantSubscription = z.infer<typeof MerchantSubscriptionSchema>
