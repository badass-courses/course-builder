import { BUNNY_TO_COURSEBUILDER_MIGRATION_EVENT } from '@/inngest/events/bunny-collections'
import { inngest } from '@/inngest/inngest.server'
import { SkillRequest, withSkill } from '@/server/with-skill'

/**
 * API endpoint to trigger Bunny.net to CourseBuilder migration
 * POST /api/bunny/migrate
 * Body: {
 *   collectionId?: string,
 *   videoGuid?: string,
 *   workshopId?: string,
 *   createdById: string, // Required: User ID for creating resources
 *   dryRun?: boolean
 * }
 */
export const POST = withSkill(async (req: SkillRequest) => {
	const body = await req.json().catch(() => ({}))
	const { collectionId, videoGuid, workshopId, createdById, dryRun } = body

	try {
		const eventId = await inngest.send({
			name: BUNNY_TO_COURSEBUILDER_MIGRATION_EVENT,
			data: {
				collectionId: collectionId || undefined,
				videoGuid: videoGuid || undefined,
				workshopId: workshopId || undefined,
				createdById: createdById || undefined,
				dryRun: dryRun === true,
			},
		})

		return new Response(
			JSON.stringify({
				success: true,
				eventId,
				message: 'Bunny.net to CourseBuilder migration event triggered',
				collectionId: collectionId || 'all',
				videoGuid: videoGuid || 'none',
				workshopId: workshopId || 'none',
				createdById: createdById || 'none',
				dryRun: dryRun === true,
			}),
			{
				status: 200,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		)
	} catch (error) {
		return new Response(
			JSON.stringify({
				success: false,
				error:
					error instanceof Error ? error.message : 'Unknown error occurred',
			}),
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		)
	}
})
