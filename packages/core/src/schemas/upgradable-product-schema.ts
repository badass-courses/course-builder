import { z } from 'zod'

export const upgradableProductSchema = z.object({
	upgradableToId: z.string().length(255),
	upgradableFromId: z.string().length(255),
	position: z.number().default(0),
	metadata: z.record(z.any()).default({}),
	createdAt: z.string().default(() => new Date().toISOString()),
	updatedAt: z.string().default(() => new Date().toISOString()),
	deletedAt: z.string().datetime().optional(),
})

export type UpgradableProduct = z.infer<typeof upgradableProductSchema>
