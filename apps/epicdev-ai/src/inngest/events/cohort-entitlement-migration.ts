/**
 * Event triggered to migrate entitlements from a cohort to workshop entitlements.
 * Finds all purchases for the sourceCohortId and creates workshop entitlements for each person.
 */
export const COHORT_ENTITLEMENT_MIGRATION_EVENT =
	'cohort/entitlement-migration' as const

export type CohortEntitlementMigration = {
	name: typeof COHORT_ENTITLEMENT_MIGRATION_EVENT
	data: {
		sourceCohortId: string
	}
}

/**
 * Event triggered to cleanup migration metadata from entitlements.
 * Removes migratedFrom and migratedAt fields, keeping only contentIds.
 */
export const COHORT_ENTITLEMENT_MIGRATION_CLEANUP_EVENT =
	'cohort/entitlement-migration-cleanup' as const

export type CohortEntitlementMigrationCleanup = {
	name: typeof COHORT_ENTITLEMENT_MIGRATION_CLEANUP_EVENT
	data: Record<string, never>
}
