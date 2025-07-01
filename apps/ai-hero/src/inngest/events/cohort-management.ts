/**
 * Event triggered when a cohort is updated (resources added/removed)
 */
export const COHORT_UPDATED_EVENT = 'cohort/updated' as const

/**
 * Event triggered when a specific resource is added to a cohort
 */
export const COHORT_RESOURCE_ADDED_EVENT = 'cohort/resource-added' as const

/**
 * Event triggered when a specific resource is removed from a cohort
 */
export const COHORT_RESOURCE_REMOVED_EVENT = 'cohort/resource-removed' as const

/**
 * Event triggered when a product is updated
 */
export const PRODUCT_UPDATED_EVENT = 'product/updated' as const

export type CohortUpdatedPayload = {
	cohortId: string
	updatedAt: string
	changes: {
		resourcesAdded?: Array<{
			resourceId: string
			position: number
		}>
		resourcesRemoved?: Array<{
			resourceId: string
		}>
		resourcesReordered?: Array<{
			resourceId: string
			oldPosition: number
			newPosition: number
		}>
	}
}

export type CohortResourceAddedPayload = {
	cohortId: string
	resourceId: string
	position: number
	resourceType: string
}

export type CohortResourceRemovedPayload = {
	cohortId: string
	resourceId: string
}

export type ProductUpdatedPayload = {
	productId: string
	updatedAt: string
	changes: {
		resourcesAdded?: Array<{
			resourceId: string
			resourceType: string
		}>
		resourcesRemoved?: Array<{
			resourceId: string
		}>
	}
}
