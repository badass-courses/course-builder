import { z } from 'zod'

export const SubscriptionMetadata = z.object({
	seats: z.number().default(1),
	organizationId: z.string().optional(),
	features: z.record(z.any()).optional(),
})

export type SubscriptionMetadata = z.infer<typeof SubscriptionMetadata>
