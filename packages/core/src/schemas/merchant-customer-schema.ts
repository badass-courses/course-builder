import { z } from 'zod'

export const merchantCustomerSchema = z.object({
	id: z.string().max(191),
	userId: z.string().max(191),
	merchantAccountId: z.string().max(191),
	identifier: z.string().max(191),
	createdAt: z
		.string()
		.datetime()
		.default(() => new Date().toISOString()),
	status: z.number().int().default(0),
})

export type MerchantCustomer = z.infer<typeof merchantCustomerSchema>
