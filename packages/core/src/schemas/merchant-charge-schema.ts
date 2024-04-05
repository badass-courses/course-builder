import { z } from 'zod'

export const merchantChargeSchema = z.object({
	id: z.string().length(191),
	status: z.number().int().default(0),
	identifier: z.string().length(191),
	userId: z.string().length(191),
	merchantAccountId: z.string().length(191),
	merchantProductId: z.string().length(191),
	createdAt: z.date().nullable(),
	merchantCustomerId: z.string().length(191),
})

export type MerchantCharge = z.infer<typeof merchantChargeSchema>
