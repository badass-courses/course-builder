// Define a more generic payload structure for resource events
// We primarily need id and type for filtering and basic identification.
// Including fields might be useful but could lead to large payloads.
// Let's stick to id and type for now; the handler can fetch full data if needed.
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
