import { z } from 'zod'

export const resourceProgressSchema = z.object({
	userId: z.string().max(191),
	contentResourceId: z.string().max(191).optional().nullable(),
	metadata: z.record(z.any()).default({}),
	completedAt: z.string().optional().nullable(),
	updatedAt: z.string().optional().nullable(),
	createdAt: z.string().default(() => new Date().toISOString()),
})

export type ResourceProgress = z.infer<typeof resourceProgressSchema>
