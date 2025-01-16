import { z } from 'zod'

import { ContentResourceSchema } from '@coursebuilder/core/schemas'

import { PostStateSchema, PostTagsChema, PostVisibilitySchema } from './posts'

export const ListTypeSchema = z.enum(['nextUp', 'tutorial', 'workshop'])

export const ListSchema = ContentResourceSchema.merge(
	z.object({
		fields: z.object({
			title: z.string(),
			description: z.string().optional(),
			slug: z.string(),
			type: ListTypeSchema.default('nextUp'),
			body: z.string().nullable().optional(),
			summary: z.string().optional().nullable(),
			state: PostStateSchema.default('draft'),
			visibility: PostVisibilitySchema.default('unlisted'),
			github: z.string().nullish(),
			gitpod: z.string().nullish(),
		}),
		resources: z.array(z.any()),
		tags: PostTagsChema,
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
		github: z.string().nullish(),
	}),
	videoResourceId: z.string().optional().nullable(),
	tags: PostTagsChema,
})

export type ListUpdate = z.infer<typeof ListUpdateSchema>
