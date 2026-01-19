/**
 * Generic resource event payload structure
 * Used for triggering workflows based on resource creation/updates
 */
export type ResourcePayloadData = {
	id: string
	type: string
}

/**
 * Event triggered when any content resource is successfully created.
 */
export const RESOURCE_CREATED_EVENT = 'resource/created' as const

export type ResourceCreated = {
	name: typeof RESOURCE_CREATED_EVENT
	data: ResourcePayloadData
}

/**
 * Event triggered when any content resource is successfully updated.
 */
export const RESOURCE_UPDATED_EVENT = 'resource/updated' as const

export type ResourceUpdated = {
	name: typeof RESOURCE_UPDATED_EVENT
	data: ResourcePayloadData
}
