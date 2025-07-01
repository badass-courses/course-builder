/**
 * Event triggered when a cohort is updated (resources added/removed)
 */
export const COHORT_UPDATED_EVENT = 'cohort/updated' as const

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
