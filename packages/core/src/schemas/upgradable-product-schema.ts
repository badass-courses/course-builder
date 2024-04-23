import { z } from 'zod'

export const upgradableProductSchema = z.object({
	upgradableToId: z.string().max(255),
	upgradableFromId: z.string().max(255),
	position: z.number().default(0),
	metadata: z.record(z.any()).default({}),
	createdAt: z.date().nullable(),
	updatedAt: z.date().nullable(),
	deletedAt: z.date().nullable(),
})

export type UpgradableProduct = z.infer<typeof upgradableProductSchema>
