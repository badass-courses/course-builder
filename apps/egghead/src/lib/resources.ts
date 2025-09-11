import { z } from 'zod'

import {
	AnyResourceTypeSchema,
	POST_SUBTYPES,
	PostTypeSchema,
	RESOURCE_TYPES_WITH_VIDEO,
	ResourceType,
	ResourceTypeSchema,
} from './resource-types'

export {
	AnyResourceTypeSchema,
	POST_SUBTYPES,
	PostTypeSchema,
	ResourceTypeSchema,
	RESOURCE_TYPES_WITH_VIDEO,
}
export type {
	AnyResourceType,
	PostSubtypeString,
	PostType,
	ResourceType,
	ResourceTypeString,
} from './resource-types'

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
 * Check if a resource type supports video
 * @param type - The resource type to check
 * @returns true if the type supports video uploads
 */
export function supportsVideo(type: string): boolean {
	// Check if it's a top-level resource type that supports video
	if (isTopLevelResourceType(type)) {
		return RESOURCE_TYPES_WITH_VIDEO.includes(type)
	}

	// Check if it's a post subtype that supports video
	const postTypesWithVideo = ['article']
	return postTypesWithVideo.includes(type)
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
