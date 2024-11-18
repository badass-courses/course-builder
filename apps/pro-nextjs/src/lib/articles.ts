import { z } from 'zod'

import { ContentResourceSchema } from '@coursebuilder/core/schemas/content-resource-schema'

export const NewArticleSchema = z.object({
	fields: z.object({
		title: z.string().min(2).max(90),
		body: z.string().optional().nullable(),
	}),
})
export type NewArticle = z.infer<typeof NewArticleSchema>

export const ArticleStateSchema = z.union([
	z.literal('draft'),
	z.literal('published'),
	z.literal('archived'),
	z.literal('deleted'),
])

export const ResourceVisibilitySchema = z.union([
	z.literal('public'),
	z.literal('private'),
	z.literal('unlisted'),
])

export const ArticleSchema = ContentResourceSchema.merge(
	z.object({
		fields: z.object({
			body: z.string().nullable().optional(),
			title: z.string(),
			description: z.string().optional(),
			slug: z.string(),
			state: ArticleStateSchema.default('draft'),
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
