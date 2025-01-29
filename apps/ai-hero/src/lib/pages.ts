import { z } from 'zod'

import { ContentResourceSchema } from '@coursebuilder/core/schemas/content-resource-schema'

export const NewPageSchema = z.object({
	fields: z.object({
		title: z.string().min(2).max(90),
		body: z.string().optional().nullable(),
	}),
})
export type NewPage = z.infer<typeof NewPageSchema>

export const PageStateSchema = z.union([
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

export const PageSchema = ContentResourceSchema.merge(
	z.object({
		fields: z.object({
			body: z.string().nullable().optional(),
			title: z.string().min(2).max(90),
			description: z.string().optional(),
			slug: z.string(),
			state: PageStateSchema.default('draft'),
			visibility: ResourceVisibilitySchema.default('public'),
			resources: z.array(ContentResourceSchema).nullish(),
			socialImage: z
				.object({
					type: z.string(),
					url: z.string().url(),
				})
				.optional(),
		}),
	}),
)

export type Page = z.infer<typeof PageSchema>
