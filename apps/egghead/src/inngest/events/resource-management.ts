/**
 * @description Event triggered when any content resource is successfully created.
 */
export const RESOURCE_CREATED_EVENT = 'resource/created' as const

export type ResourceCreated = {
	name: typeof RESOURCE_CREATED_EVENT
	data: { id: string; type: string }
}

/**
 * @description Event triggered when any content resource is successfully updated.
 */
export const RESOURCE_UPDATED_EVENT = 'resource/updated' as const

export type ResourceUpdated = {
	name: typeof RESOURCE_UPDATED_EVENT
	data: { id: string; type: string }
}
