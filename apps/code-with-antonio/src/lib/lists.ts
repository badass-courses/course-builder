import { z } from 'zod'

import { ContentResourceSchema } from '@coursebuilder/core/schemas'

import {
	FeaturedSchema,
	PostStateSchema,
	PostTagsSchema,
	PostVisibilitySchema,
} from './posts'

export const ListTypeSchema = z.enum(['tutorial', 'nextUp'])

export const ListSchema = ContentResourceSchema.merge(
	z.object({
		fields: z.object({
			title: z.string(),
			description: z.string().optional(),
			slug: z.string(),
			type: ListTypeSchema.default('tutorial'),
			body: z.string().nullable().optional(),
			summary: z.string().optional().nullable(),
			state: PostStateSchema.default('draft'),
			visibility: PostVisibilitySchema.default('public'),
			image: z.string().nullish(),
			github: z.string().nullish(),
			gitpod: z.string().nullish(),
			featured: FeaturedSchema.optional(),
		}),
		resources: z.array(z.any()),
		tags: PostTagsSchema,
	}),
)

export type List = z.infer<typeof ListSchema>

export const ListUpdateSchema = z.object({
	id: z.string(),
	fields: z.object({
		title: z.string().min(2).max(90),
		body: z.string().optional().nullable(),
		slug: z.string(),
		type: ListTypeSchema.default('nextUp'),
		description: z.string().nullish(),
		state: PostStateSchema.default('draft'),
		visibility: PostVisibilitySchema.default('unlisted'),
		image: z.string().nullish(),
		github: z.string().nullish(),
		gitpod: z.string().nullish(),
	}),
	resources: z.array(z.any()),
	tags: PostTagsSchema,
})

export type ListUpdate = z.infer<typeof ListUpdateSchema>
