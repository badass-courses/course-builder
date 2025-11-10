/**
 * Event triggered when requesting migration from Bunny.net to CourseBuilder
 */
export const BUNNY_TO_COURSEBUILDER_MIGRATION_EVENT =
	'bunny/migrate-to-coursebuilder' as const

export type BunnyToCoursebuilderMigration = {
	name: typeof BUNNY_TO_COURSEBUILDER_MIGRATION_EVENT
	data: {
		collectionId?: string // Optional: GUID of the collection (from collections list) to fetch videos for
		videoGuid?: string // Optional: GUID of specific video to migrate (for testing)
		workshopId?: string // Optional: Workshop ID to attach the lesson to (for testing)
		createdById: string // User ID to use for creating resources (required for migration)
		dryRun?: boolean // If true, don't actually migrate, just discover and log
	}
}
