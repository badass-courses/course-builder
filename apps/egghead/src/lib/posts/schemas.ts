import { z } from 'zod'

import { productSchema } from '@coursebuilder/core/schemas'
import { ContentResourceSchema } from '@coursebuilder/core/schemas/content-resource-schema'

// Schema exports
export const PostActionSchema = z.union([
	z.literal('publish'),
	z.literal('unpublish'),
	z.literal('archive'),
	z.literal('save'),
])

export const PostStateSchema = z.union([
	z.literal('draft'),
	z.literal('published'),
	z.literal('archived'),
	z.literal('deleted'),
])

export const PostVisibilitySchema = z.union([
	z.literal('public'),
	z.literal('private'),
	z.literal('unlisted'),
])

export const PostAccessSchema = z.union([z.literal('free'), z.literal('pro')])

export const PostTypeSchema = z.union([
	z.literal('article'),
	z.literal('lesson'),
	z.literal('podcast'),
	z.literal('tip'),
	z.literal('course'),
])

export const PostSchema = ContentResourceSchema.merge(
	z.object({
		fields: z.object({
			title: z.string(),
			image: z.string().nullish(),
			ogImage: z.string().nullish(),
			postType: PostTypeSchema.default('lesson'),
			summary: z.string().optional().nullable(),
			body: z.string().nullable().optional(),
			state: PostStateSchema.default('draft'),
			visibility: PostVisibilitySchema.default('public'),
			access: PostAccessSchema.default('pro'),
			eggheadLessonId: z.coerce.number().nullish(),
			eggheadPlaylistId: z.coerce.number().nullish(),
			slug: z.string(),
			description: z.string().nullish(),
			github: z.string().nullish(),
			gitpod: z.string().nullish(),
			primaryTagId: z.string().nullish(),
		}),
		tags: z.array(z.any()).nullish(),
		currentVersionId: z.string().nullish(),
	}),
)

export const NewPostSchema = z.object({
	title: z.string().min(2).max(90),
	postType: PostTypeSchema.default('lesson'),
	videoResourceId: z.string().min(4, 'Please upload a video').nullish(),
})

export const PostUpdateSchema = z.object({
	id: z.string(),
	fields: z.object({
		title: z.string().min(2).max(90),
		postType: PostTypeSchema.optional().default('lesson'),
		body: z.string().optional().nullable(),
		description: z.string().optional().nullable(),
		visibility: PostVisibilitySchema.optional().default('public'),
		access: PostAccessSchema.optional().default('pro'),
		state: PostStateSchema.optional().default('draft'),
		image: z.string().nullish(),
		ogImage: z.string().nullish(),
	}),
	videoResourceId: z.string().optional().nullable(),
})

/**
 * Minimal post data for listing/searching (lightweight for caching)
 */
export const MinimalPostSchema = z.object({
	id: z.string(),
	createdById: z.string(),
	createdAt: z.date().nullable(),
	fields: z.object({
		title: z.string().optional(),
		slug: z.string().optional(),
		state: z.string().optional(),
		postType: z.string().optional(),
		description: z.string().optional(),
	}),
	tags: z
		.array(
			z.object({
				tag: z.object({
					id: z.string(),
					name: z.string(),
				}),
			}),
		)
		.optional(),
})

export const ProductForPostPropsSchema = z.object({
	availableBonuses: z.array(z.any()).default([]),
	purchaseCount: z.number().optional(),
	quantityAvailable: z.number().default(-1),
	totalQuantity: z.number().optional(),
	product: productSchema,
	pricingDataLoader: z.any(),
	purchases: z.array(z.any()).optional(),
	hasPurchasedCurrentProduct: z.boolean().optional(),
	existingPurchase: z.any().optional(),
	session: z.any().optional(),
})

export type ProductForPostProps = z.infer<typeof ProductForPostPropsSchema>
