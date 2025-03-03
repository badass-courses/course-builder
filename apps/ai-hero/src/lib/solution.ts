import { z } from 'zod'

import {
	ContentResourceResourceSchema,
	ContentResourceSchema,
} from '@coursebuilder/core/schemas/content-resource-schema'

/**
 * Schema definition for solution resources.
 * Solutions are special resources that provide working code examples
 * and explanations for workshop lessons.
 */
export const SolutionSchema = ContentResourceSchema.merge(
	z.object({
		id: z.string(),
		type: z.literal('solution'),
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
			videoResourceId: z.string().nullable().optional(),
		}),
		resources: z.array(z.any()).default([]).nullable(),
	}),
)

/**
 * Type definition for a Solution resource
 */
export type Solution = z.infer<typeof SolutionSchema>
