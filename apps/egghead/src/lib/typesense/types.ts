import { EggheadTagSchema } from '@/lib/tags'
import * as z from 'zod'

/**
 * Schema for TypeSense instructor data
 */
export const TypesenseInstructorSchema = z.object({
	id: z.number().optional(),
	name: z.string().optional(),
	first_name: z.string().optional(),
	last_name: z.string().optional(),
	full_name: z.string().optional(),
	avatar_url: z.string().url().optional(),
})

/**
 * Schema for TypeSense post data
 */
export const TypesensePostSchema = z.object({
	type: z.string().optional(),
	id: z.string().optional(),
	name: z.string().optional(),
	title: z.string().optional(),
	slug: z.string().optional(),
	externalId: z.string().optional(),
	description: z.string().optional(),
	summary: z.string().optional(),
	image: z.string().optional(),
	_tags: z.array(z.string()).optional(),
	primary_tag: EggheadTagSchema.optional(),
	primary_tag_image_url: z.string().optional(),
	instructor: TypesenseInstructorSchema.optional(),
	instructor_name: z.string().optional(),
	instructor_url: z.string().url().optional(),
	path: z.string().optional(),
	published_at_timestamp: z.number().nullish(),
	belongs_to_resource: z.number().nullish(),
	belongs_to_resource_title: z.string().optional(),
	belongs_to_resource_slug: z.string().optional(),
	resources: z
		.array(
			z.object({
				id: z.string(),
				title: z.string(),
				slug: z.string(),
				eggheadPlaylistId: z.number(),
			}),
		)
		.optional(),
})

/**
 * Schema for TypeSense resource data
 */
export const TypesenseResourceSchema = z.object({
	id: z.string(),
	externalId: z.string(),
	title: z.string(),
	slug: z.string(),
	summary: z.string(),
	state: z.string(),
	description: z.string(),
	name: z.string(),
	path: z.string(),
	type: z.string(),
	instructor_name: z.string(),
	instructor: z.object({
		full_name: z.string(),
	}),
	image: z.string(),
	published_at_timestamp: z.number(),
	updated_at_timestamp: z.number(),
})

/**
 * Map of attribute names to user-friendly labels
 */
export const attributeLabelMap: {
	[K in keyof z.infer<typeof TypesenseResourceSchema>]: string
} = {
	instructor_name: 'Instructor',
	description: 'Description',
	title: 'Title',
	summary: 'Summary',
	type: 'Type',
	state: 'State',
	externalId: 'External ID',
	id: 'ID',
	image: 'Image',
	instructor: 'Instructor',
	name: 'Name',
	path: 'Path',
	published_at_timestamp: 'Published At',
	updated_at_timestamp: 'Updated At',
	slug: 'Slug',
} as const

/**
 * TypeSense resource type
 */
export type TypesenseResource = z.infer<typeof TypesenseResourceSchema>

/**
 * TypeSense post type
 */
export type TypesensePost = z.infer<typeof TypesensePostSchema>

/**
 * TypeSense instructor type
 */
export type TypesenseInstructor = z.infer<typeof TypesenseInstructorSchema>
