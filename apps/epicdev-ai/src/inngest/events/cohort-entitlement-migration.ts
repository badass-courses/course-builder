/**
 * Event triggered to migrate entitlements from one cohort to another
 */
export const COHORT_ENTITLEMENT_MIGRATION_EVENT =
	'cohort/entitlement-migration' as const

export type CohortEntitlementMigration = {
	name: typeof COHORT_ENTITLEMENT_MIGRATION_EVENT
	data: {
		sourceCohortId: string
		targetCohortId: string
	}
}
