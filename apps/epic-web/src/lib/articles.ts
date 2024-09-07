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
		contributions: z.array(
			z.object({
				user: z.object({
					id: z.string(),
					name: z.string().optional().nullable(),
					email: z.string().optional().nullable(),
					image: z.string().optional().nullable(),
				}),
				contributionType: z.object({
					id: z.string(),
					slug: z.string(),
					name: z.string(),
					description: z.string().optional(),
				}),
			}),
		),
		fields: z.object({
			body: z.string().nullable().optional(),
			title: z.string().min(2).max(90),
			description: z.string().optional(),
			slug: z.string(),
			state: ResourceStateSchema.default('draft'),
			visibility: ResourceVisibilitySchema.default('unlisted'),
			ogImage: z
				.object({
					type: z.string().default('upload'),
					url: z.string().url(),
				})
				.optional(),
			image: z
				.object({
					type: z.string().default('upload'),
					url: z.string().url(),
				})
				.optional(),
		}),
	}),
)

export type Article = z.infer<typeof ArticleSchema>
