import { z } from 'zod'

export const merchantPriceSchema = z.object({
	id: z.string().max(191),
	merchantAccountId: z.string().max(191),
	merchantProductId: z.string().max(191),
	status: z.number().int().default(0),
	identifier: z.string().max(191).optional().nullable(),
	createdAt: z.date(),
	priceId: z.string().max(191).optional().nullable(),
})

export type MerchantPrice = z.infer<typeof merchantPriceSchema>
