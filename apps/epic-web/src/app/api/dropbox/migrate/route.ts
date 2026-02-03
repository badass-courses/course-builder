import { DROPBOX_TO_COURSEBUILDER_MIGRATION_EVENT } from '@/inngest/events/dropbox-migration'
import { inngest } from '@/inngest/inngest.server'
import { SkillRequest, withSkill } from '@/server/with-skill'

/**
 * API endpoint to trigger Dropbox to CourseBuilder import
 *
 * POST /api/dropbox/migrate
 *
 * The folderPath is REQUIRED and serves two purposes:
 * 1. Specifies which Dropbox folder to import videos from
 * 2. The folder name becomes the workshop name (e.g., "/Workshops/React Fundamentals" → "React Fundamentals")
 *
 * @example Request body:
 * {
 *   folderPath: string,        // REQUIRED: Dropbox folder path (becomes workshop name!)
 *   videoFileName?: string,    // Optional: single video to import (for testing)
 *   createdById: string,       // REQUIRED: User ID for creating resources
 *   dryRun?: boolean           // Optional: preview what will be created without creating
 * }
 *
 * @example Usage:
 *
 * // Preview what will be created (dry run)
 * curl -X POST /api/dropbox/migrate \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "folderPath": "/Workshops/React Fundamentals",
 *     "createdById": "user_abc123",
 *     "dryRun": true
 *   }'
 *
 * // Import a single video for testing
 * curl -X POST /api/dropbox/migrate \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "folderPath": "/Workshops/React Fundamentals",
 *     "videoFileName": "01-intro.mp4",
 *     "createdById": "user_abc123"
 *   }'
 *
 * // Import all videos and create workshop
 * curl -X POST /api/dropbox/migrate \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "folderPath": "/Workshops/React Fundamentals",
 *     "createdById": "user_abc123"
 *   }'
 */
export const POST = withSkill(async (req: SkillRequest) => {
	const body = await req.json().catch(() => ({}))
	const { folderPath, videoFileName, createdById, dryRun } = body

	// Validate required fields
	if (!folderPath) {
		return new Response(
			JSON.stringify({
				success: false,
				error:
					'folderPath is required - the folder name will be used as the workshop name',
			}),
			{
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			},
		)
	}

	if (!createdById && dryRun !== true) {
		return new Response(
			JSON.stringify({
				success: false,
				error:
					'createdById is required for import (use dryRun: true to preview)',
			}),
			{
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			},
		)
	}

	// Extract workshop name from folder path for logging
	const workshopName = folderPath.split('/').filter(Boolean).pop() || 'Unknown'

	console.log('[api.dropbox.migrate] Triggering import', {
		folderPath,
		workshopName,
		videoFileName: videoFileName || 'all',
		createdById: createdById || 'none',
		dryRun: dryRun === true,
	})

	try {
		const eventId = await inngest.send({
			name: DROPBOX_TO_COURSEBUILDER_MIGRATION_EVENT,
			data: {
				folderPath,
				videoFileName: videoFileName || undefined,
				createdById: createdById || undefined,
				dryRun: dryRun === true,
			},
		})

		return new Response(
			JSON.stringify({
				success: true,
				eventId,
				message: `Dropbox import started - will create workshop "${workshopName}"`,
				folderPath,
				workshopName,
				videoFileName: videoFileName || 'all videos',
				createdById: createdById || 'none',
				dryRun: dryRun === true,
			}),
			{
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			},
		)
	} catch (error) {
		console.error('[api.dropbox.migrate] Error triggering import', {
			error: error instanceof Error ? error.message : String(error),
			folderPath,
		})

		return new Response(
			JSON.stringify({
				success: false,
				error:
					error instanceof Error ? error.message : 'Unknown error occurred',
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			},
		)
	}
})
