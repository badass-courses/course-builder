import { z } from 'zod'

export const resourceProgressSchema = z.object({
	userId: z.string().max(191),
	contentResourceId: z.string().max(191).optional().nullable(),
	metadata: z.record(z.any()).default({}),
	completedAt: z.date().nullable(),
	updatedAt: z.date().nullable(),
	createdAt: z.date().nullable(),
})

export type ResourceProgress = z.infer<typeof resourceProgressSchema>
