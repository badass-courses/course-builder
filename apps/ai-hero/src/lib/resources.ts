import { z } from 'zod'

import { PostType, PostTypeSchema } from './posts'

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
])

/**
 * Type representing all top-level resource types
 */
export type ResourceType = z.infer<typeof ResourceTypeSchema>

/**
 * Resource types that support video content
 */
export const RESOURCE_TYPES_WITH_VIDEO: ResourceType[] = [
	'workshop',
	'tutorial',
]

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
 * Mapping between resource types and their available post subtypes
 * This defines which post subtypes can be created within each resource type
 */
export const RESOURCE_TYPE_TO_POST_SUBTYPES: Record<ResourceType, string[]> = {
	post: [
		'article',
		'podcast',
		'tip',
		'cohort-lesson',
		'cohort-lesson-solution',
		'course',
		'playlist',
	],
	workshop: [],
	tutorial: [],
	cohort: [],
	list: [],
	page: [],
} as const

/**
 * Check if a given string is a valid top-level resource type
 * @param type - The type string to check
 * @returns true if the type is a valid top-level resource type
 */
export function isTopLevelResourceType(type: string): type is ResourceType {
	return ResourceTypeSchema.safeParse(type).success
}

/**
 * Check if a given string is a valid post subtype
 * @param type - The type string to check
 * @returns true if the type is a valid post subtype
 */
export function isPostSubtype(type: string): boolean {
	return PostTypeSchema.safeParse(type).success
}

/**
 * Configuration for creating resources
 * Used to define the available resource types and subtypes for creation
 */
export interface ResourceCreationConfig {
	title: string
	availableTypes: Array<
		| { type: 'post'; postTypes: string[] }
		| { type: Exclude<ResourceType, 'post'> }
	>
	defaultType: { type: ResourceType; postType?: string }
}

/**
 * Input for creating a new resource
 */
export interface CreateResourceInput {
	type: ResourceType
	title: string
}
