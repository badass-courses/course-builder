import { z } from 'zod'

/**
 * Schema for post subtypes that can be used within the 'post' resource type
 */
export const PostTypeSchema = z.literal('article')

/**
 * Type representing post subtypes
 */
export type PostType = z.infer<typeof PostTypeSchema>

/**
 * Valid post subtypes - only the 'post' resource type has subtypes
 */
export const POST_SUBTYPES: (PostType | string)[] = ['article', 'event']

/**
 * Schema defining all top-level resource types in the system
 * This schema should be used when working with primary resource entities
 * that are not post subtypes.
 */
export const ResourceTypeSchema = z.enum([
	'post',
	'workshop',
	'tutorial',
	'cohort',
	'list',
	'page',
	'lesson',
	'solution',
	'section',
	'event',
	'event-series',
])

/**
 * Type representing all top-level resource types
 */
export type ResourceType = z.infer<typeof ResourceTypeSchema>

/**
 * String literal type for resource types - useful for better autocomplete
 */
export type ResourceTypeString = keyof typeof ResourceTypeSchema.enum

/**
 * String literal type for post subtypes - useful for better autocomplete
 */
export type PostSubtypeString = (typeof POST_SUBTYPES)[number]

/**
 * Combined schema for all resource type identifiers, including both
 * top-level resource types and post subtypes
 */
export const AnyResourceTypeSchema = z.union([
	ResourceTypeSchema,
	PostTypeSchema,
])

export type AnyResourceType = z.infer<typeof AnyResourceTypeSchema>

/**
 * Resource types that support video content
 */
export const RESOURCE_TYPES_WITH_VIDEO: ResourceType[] = ['lesson']

/**
 * Post types that support video content
 */
export const POST_TYPES_WITH_VIDEO: (PostType | string)[] = ['article']
