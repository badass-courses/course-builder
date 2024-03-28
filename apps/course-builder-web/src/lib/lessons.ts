import { z } from 'zod'

import { ContentResourceSchema } from '@coursebuilder/core/schemas/content-resource-schema'

export const LessonSchema = ContentResourceSchema.merge(
	z.object({
		fields: z.object({
			title: z.string().min(2).max(90),
			body: z.string().optional(),
			slug: z.string(),
		}),
	}),
)

export type Lesson = z.infer<typeof LessonSchema>
