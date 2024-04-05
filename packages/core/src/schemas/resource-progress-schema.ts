import { z } from 'zod'

export const resourceProgressSchema = z.object({
	userId: z.string().max(191),
	contentResourceId: z.string().max(191).optional(),
	metadata: z.record(z.any()).default({}),
	completedAt: z.string().datetime().optional(),
	updatedAt: z.string().datetime().optional(),
	createdAt: z
		.string()
		.datetime()
		.default(() => new Date().toISOString()),
})

export type ResourceProgress = z.infer<typeof resourceProgressSchema>
