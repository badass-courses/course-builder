/**
 * Event triggered when a cohort is updated (resources added/removed)
 */
export const COHORT_UPDATED_EVENT = 'cohort/updated' as const

/**
 * Event triggered to sync entitlements for a single user after a cohort update.
 * This is emitted as a fan-out from the main cohort-entitlement-sync-workflow.
 */
export const COHORT_ENTITLEMENT_SYNC_USER_EVENT =
	'cohort-entitlement/sync.user' as const

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

export type CohortEntitlementSyncUserPayload = {
	cohortId: string
	userId: string
	userEmail: string | null
	/** Cohort resource IDs to avoid re-fetching in the child function */
	cohortResourceIds: string[]
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
