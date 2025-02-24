'use server'

import { isTopLevelResourceType, ResourceType } from '@/lib/resources'
import { log } from '@/server/logger'

import { createResource } from './create-resources'

/**
 * Server action to create a new top-level resource
 *
 * @param type - The type of resource to create (workshop, tutorial, etc.)
 * @param title - The title of the new resource
 * @returns The created resource or null if creation failed
 */
export async function createResourceAction(type: string, title: string) {
	try {
		// Validate that this is a top-level resource type
		if (!isTopLevelResourceType(type)) {
			log.error('resource_creation', {
				error: `Invalid resource type: ${type}`,
				type,
				title,
			})
			throw new Error(`Invalid resource type: ${type}`)
		}

		log.info('resource_creation', {
			type,
			title,
			action: 'create_resource',
		})

		const resource = await createResource({ type: type as ResourceType, title })
		return resource
	} catch (error) {
		log.error('resource_creation', {
			error: error instanceof Error ? error.message : String(error),
			type,
			title,
		})
		throw new Error('Failed to create resource')
	}
}
