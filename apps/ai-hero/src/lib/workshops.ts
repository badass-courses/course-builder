import z from 'zod'

import {
	ContentResourceSchema,
	productSchema,
} from '@coursebuilder/core/schemas'

import { PostTagsSchema } from './posts'
import { TagSchema } from './tags'

export const WorkshopFieldsSchema = z.object({
	title: z.string().min(1, { message: 'Title is required' }),
	subtitle: z.string().optional(),
	description: z.string().optional(),
	body: z.string().optional(),
	state: z.enum(['draft', 'published', 'archived', 'deleted']).default('draft'),
	startsAt: z.string().datetime().nullish(),
	endsAt: z.string().datetime().nullish(),
	timezone: z.string().default('America/Los_Angeles'),
	slug: z.string().min(1, { message: 'Slug is required' }),
	visibility: z.enum(['public', 'private', 'unlisted']).default('unlisted'),
	coverImage: z
		.object({
			url: z.string().optional(),
			alt: z.string().optional(),
		})
		.optional(),
	github: z.string().optional(),
	githubUrl: z.string().optional(),
})

/**
 * Define the workshop schema by extending ContentResourceSchema
 */
export const WorkshopSchema = ContentResourceSchema.merge(
	z.object({
		type: z.literal('workshop'),
		id: z.string(),
		fields: WorkshopFieldsSchema,
		tags: PostTagsSchema,
	}),
)

/**
 * Workshop resource type definition
 */
export type Workshop = z.infer<typeof WorkshopSchema>

export const MinimalWorkshopSchema = z.object({
	id: z.string(),
	type: z.literal('workshop'),
	fields: WorkshopFieldsSchema,
})

export type MinimalWorkshop = z.infer<typeof MinimalWorkshopSchema>

/**
 * Input type for workshop creation with lessons
 */
export type CreateWorkshopWithLessonsInput = {
	workshop: {
		title: string
		description?: string
		tagIds?: { id: string; fields: { label: string; name: string } }[] | null
	}
	createProduct?: boolean
	pricing: {
		price?: number | null
		quantity?: number | null
	}
	coupon?: {
		enabled: boolean
		percentageDiscount?: string
		expires?: Date
	}
	structure: Array<
		| {
				type: 'section'
				title: string
				lessons: { title: string; videoResourceId?: string }[]
		  }
		| { type: 'lesson'; title: string; videoResourceId?: string }
	>
}
