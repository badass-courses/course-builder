import { z } from 'zod'

export const priceSchema = z.object({
	id: z.string().max(191),
	productId: z.string().max(191).optional(),
	nickname: z.string().max(191).optional(),
	status: z.number().int().default(0),
	unitAmount: z.number().refine((value) => {
		const decimalPlaces = value.toString().split('.')[1]?.length || 0
		return decimalPlaces <= 2
	}),
	createdAt: z
		.string()
		.datetime()
		.default(() => new Date().toISOString()),
	metadata: z.record(z.any()).default({}),
})

export type Price = z.infer<typeof priceSchema>
