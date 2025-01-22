import { z } from 'zod'

import { ContentResourceSchema } from '@coursebuilder/core/schemas'

import { PostStateSchema, PostTagsSchema, PostVisibilitySchema } from './posts'

export const ListTypeSchema = z.enum(['nextUp', 'tutorial', 'workshop'])

const ListResourceSchema = z.object({
	resourceId: z.string(),
	resourceOfId: z.string(),
	position: z.number().default(0),
	metadata: z.record(z.string(), z.any()).default({}).nullable(),
	createdAt: z.coerce.date().nullable(),
	updatedAt: z.coerce.date().nullable(),
	deletedAt: z.coerce.date().nullable(),
	resource: ContentResourceSchema.nullable(),
})

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
			image: z.string().nullish(),
			github: z.string().nullish(),
			gitpod: z.string().nullish(),
		}),
		resources: z.array(ListResourceSchema),
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
	resources: z.array(ListResourceSchema),
	tags: PostTagsSchema,
})

export type ListUpdate = z.infer<typeof ListUpdateSchema>
