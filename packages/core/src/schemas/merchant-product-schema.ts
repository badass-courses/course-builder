import { z } from 'zod'

export const merchantProductSchema = z.object({
	id: z.string().max(191),
	merchantAccountId: z.string().max(191),
	productId: z.string().max(191),
	status: z.number().int().default(0),
	identifier: z.string().max(191).optional().nullable(),
	createdAt: z.date().nullable(),
})

export type MerchantProduct = z.infer<typeof merchantProductSchema>
