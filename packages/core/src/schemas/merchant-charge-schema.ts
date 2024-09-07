import { z } from 'zod'

export const merchantChargeSchema = z.object({
	id: z.string().max(191),
	status: z.number().int().default(0),
	identifier: z.string().max(191),
	userId: z.string().max(191),
	merchantAccountId: z.string().max(191),
	merchantProductId: z.string().max(191),
	createdAt: z.date().nullable(),
	merchantCustomerId: z.string().max(191),
})

export type MerchantCharge = z.infer<typeof merchantChargeSchema>
