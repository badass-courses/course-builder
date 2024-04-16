import { z } from 'zod'

export const merchantAccountSchema = z.object({
	id: z.string().max(191),
	label: z.string().max(191),
	identifier: z.string().max(191),
	createdAt: z.date().nullable(),
	status: z.number().int().default(0),
})

export type MerchantAccount = z.infer<typeof merchantAccountSchema>
