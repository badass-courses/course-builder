/**
 * Event triggered when requesting import from Dropbox to CourseBuilder
 *
 * The folderPath is used to:
 * 1. List videos from that Dropbox folder
 * 2. Create a workshop with the folder name (e.g., "/Workshops/React Fundamentals" → "React Fundamentals")
 * 3. Attach all imported lessons to that workshop
 */
export const DROPBOX_TO_COURSEBUILDER_MIGRATION_EVENT =
	'dropbox/migrate-to-coursebuilder' as const

export type DropboxToCoursebuilderMigration = {
	name: typeof DROPBOX_TO_COURSEBUILDER_MIGRATION_EVENT
	data: {
		/** Path to the Dropbox folder - the folder name becomes the workshop name */
		folderPath: string
		/** Optional: Specific video filename to import (for testing single video) */
		videoFileName?: string
		/** User ID to use for creating resources (required for import) */
		createdById: string
		/** If true, discover and log but don't create resources */
		dryRun?: boolean
	}
}
