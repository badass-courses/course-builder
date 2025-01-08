import { z } from 'zod'

import { ContentResourceSchema } from '@coursebuilder/core/schemas'

import { PostSchema, PostStateSchema, PostVisibilitySchema } from './posts'

export const ListSchema = ContentResourceSchema.merge(
	z.object({
		fields: z.object({
			title: z.string(),
			description: z.string().optional(),
			slug: z.string(),
			body: z.string().nullable().optional(),
			summary: z.string().optional().nullable(),
			state: PostStateSchema.default('draft'),
			visibility: PostVisibilitySchema.default('unlisted'),
			github: z.string().nullish(),
			gitpod: z.string().nullish(),
		}),
		resources: z.array(z.any()),
	}),
)

export type List = z.infer<typeof ListSchema>
