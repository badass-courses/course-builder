import { z } from 'zod'

import { ContentResourceSchema } from './content-resource-schema'

export const resourceProgressSchema = z.object({
	userId: z.string().max(191),
	resourceId: z.string().max(191).optional().nullable(),
	completedAt: z.date().nullable(),
})

export type ResourceProgress = z.infer<typeof resourceProgressSchema>

export const moduleProgressSchema = z.object({
	completedLessons: z.array(resourceProgressSchema),
	nextResource: ContentResourceSchema.partial().nullable(),
	percentCompleted: z.number().default(0),
	completedLessonsCount: z.number().default(0),
	totalLessonsCount: z.number().default(0),
})

export type ModuleProgress = z.infer<typeof moduleProgressSchema>
