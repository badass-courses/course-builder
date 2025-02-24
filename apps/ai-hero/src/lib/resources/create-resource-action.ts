'use server'

import {
	isPostSubtype,
	isTopLevelResourceType,
	POST_SUBTYPES,
	ResourceType,
	ResourceTypeSchema,
} from '@/lib/resources'
import { log } from '@/server/logger'

import { createResource } from './create-resources'

/**
 * Error class for resource creation errors
 */
export class ResourceCreationError extends Error {
	constructor(
		message: string,
		public readonly type: string,
		public readonly details?: Record<string, any>,
	) {
		super(message)
		this.name = 'ResourceCreationError'
	}
}

/**
 * Server action to create a new top-level resource
 *
 * @param type - The type of resource to create (workshop, tutorial, etc.)
 * @param title - The title of the new resource
 * @returns The created resource or null if creation failed
 * @throws {ResourceCreationError} When validation fails or resource creation fails
 */
export async function createResourceAction(type: string, title: string) {
	try {
		// Validate title
		if (!title || title.trim().length < 2) {
			throw new ResourceCreationError(
				'Resource title must be at least 2 characters long',
				'validation_error',
				{ field: 'title', value: title },
			)
		}

		// Validate that this is a top-level resource type
		if (!isTopLevelResourceType(type)) {
			// If it's a post subtype, suggest using createPost instead
			if (isPostSubtype(type) || POST_SUBTYPES.includes(type)) {
				throw new ResourceCreationError(
					`"${type}" is a post subtype, not a top-level resource type. Use createPost() instead.`,
					'invalid_resource_type',
					{
						value: type,
						validTypes: Object.keys(ResourceTypeSchema.enum),
						suggestedAction: 'createPost',
					},
				)
			}

			// Otherwise it's just an invalid type
			throw new ResourceCreationError(
				`Invalid resource type: "${type}". Valid types are: ${Object.values(ResourceTypeSchema.enum).join(', ')}`,
				'invalid_resource_type',
				{ value: type, validTypes: Object.values(ResourceTypeSchema.enum) },
			)
		}

		log.info('resource_creation', {
			type,
			title,
			action: 'create_resource',
		})

		const resource = await createResource({ type: type as ResourceType, title })

		if (!resource) {
			throw new ResourceCreationError(
				'Failed to create resource - resource creation returned null',
				'creation_failed',
				{ type, title },
			)
		}

		return resource
	} catch (error) {
		// Handle our custom errors
		if (error instanceof ResourceCreationError) {
			log.error('resource_creation', {
				error: error.message,
				errorType: error.type,
				details: error.details,
				type,
				title,
			})
			throw error
		}

		// Handle unexpected errors
		log.error('resource_creation', {
			error: error instanceof Error ? error.message : String(error),
			type,
			title,
		})
		throw new ResourceCreationError(
			'Failed to create resource due to an unexpected error',
			'unexpected_error',
			{ originalError: error instanceof Error ? error.message : String(error) },
		)
	}
}
