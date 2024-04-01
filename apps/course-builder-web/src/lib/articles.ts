import { z } from 'zod'

import {
	ContentResourceSchema,
	ResourceStateSchema,
	ResourceVisibilitySchema,
} from '@coursebuilder/core/schemas/content-resource-schema'

export const NewArticleSchema = z.object({
	fields: z.object({
		title: z.string().min(2).max(90),
		body: z.string().optional().nullable(),
	}),
})
export type NewArticle = z.infer<typeof NewArticleSchema>

export const ArticleSchema = ContentResourceSchema.merge(
	z.object({
		fields: z.object({
			body: z.string().nullable().optional(),
			title: z.string().min(2).max(90),
			description: z.string().optional(),
			slug: z.string(),
			state: ResourceStateSchema.default('draft'),
			visibility: ResourceVisibilitySchema.default('unlisted'),
			socialImage: z
				.object({
					type: z.string(),
					url: z.string().url(),
				})
				.optional(),
		}),
	}),
)

export type Article = z.infer<typeof ArticleSchema>
