import { db } from '@/db'
import { eggheadPgQuery } from '@/db/eggheadPostgres'
import { PostSchema } from '@/lib/posts'

import { VIDEO_RESOURCE_CREATED_EVENT } from '@coursebuilder/core/inngest/video-processing/events/event-video-resource'

import { inngest } from '../inngest.server'

export const syncVideoResourceData = inngest.createFunction(
	{
		id: `egghead video resource created sync`,
		name: 'egghead Video Resource Created Sync',
	},
	{
		event: VIDEO_RESOURCE_CREATED_EVENT,
	},
	async ({ event, step, db: courseBuilderAdapter }) => {
		const videoResource = await step.run(
			'load the video resource',
			async () => {
				return await courseBuilderAdapter.getVideoResource(
					event.data.videoResourceId,
				)
			},
		)

		const parentResource = await step.run(
			'load the parent resource',
			async () => {
				const resourceResource =
					await db.query.contentResourceResource.findFirst({
						where: (cr, { eq }) =>
							eq(cr.resourceId, event.data.videoResourceId),
					})

				if (resourceResource) {
					return PostSchema.nullable().parse(
						await courseBuilderAdapter.getContentResource(
							resourceResource.resourceOfId,
						),
					)
				}

				return null
			},
		)

		if (parentResource && videoResource) {
			await step.run('update the parent resource', async () => {
				const hlsUrl = `https://stream.mux.com/${videoResource.muxPlaybackId}.m3u8`
				const duration = videoResource.duration ?? 0

				// TODO: also write to Sanity?

				if (parentResource.fields.eggheadLessonId) {
					await eggheadPgQuery(
						`UPDATE lessons SET
                duration = $1,
                updated_at = NOW(),
                current_video_hls_url = $2
              WHERE id = $3`,
						[
							Math.floor(duration),
							hlsUrl,
							parentResource.fields.eggheadLessonId,
						],
					)
				}
			})
		}
	},
)
