import { z } from 'zod'

import {
	ContentResourceResourceSchema,
	ContentResourceSchema,
} from '@coursebuilder/core/schemas/content-resource-schema'

export const LessonSchema = ContentResourceSchema.merge(
	z.object({
		id: z.string(),
		type: z.string(),
		createdById: z.string(),
		createdAt: z.coerce.date().nullable(),
		updatedAt: z.coerce.date().nullable(),
		deletedAt: z.coerce.date().nullable(),
		fields: z.object({
			title: z.string().min(2).max(90),
			body: z.string().optional(),
			slug: z.string(),
			description: z.string().optional(),
			state: z
				.enum(['draft', 'published', 'archived', 'deleted'])
				.default('draft'),
			visibility: z.enum(['public', 'private', 'unlisted']).default('unlisted'),
			github: z.string().optional(),
			gitpod: z.string().optional(),
		}),
		resources: z.array(ContentResourceResourceSchema).default([]).nullable(),
	}),
)

export type Lesson = z.infer<typeof LessonSchema>
