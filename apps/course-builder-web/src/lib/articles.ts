import { z } from 'zod'

export const NewArticleSchema = z.object({
	title: z.string().min(2).max(90),
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

export const ArticleSchema = z.object({
	id: z.string(),
	type: z.literal('article'),
	updatedAt: z.string(),
	createdAt: z.string(),
	title: z.string().min(2).max(90),
	body: z.string().optional().nullable(),
	description: z.string().optional().nullable(),
	slug: z.string(),
	state: ArticleStateSchema.default('draft'),
	visibility: ResourceVisibilitySchema.default('unlisted'),
	socialImage: z.string().optional().nullable(),
})

export type Article = z.infer<typeof ArticleSchema>
