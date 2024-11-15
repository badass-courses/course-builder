import { db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import { inngest } from '@/inngest/inngest.server'
import {
	keyGenerator,
	sanityVideoResourceDocumentSchema,
} from '@/lib/sanity-content'
import { sanityWriteClient } from '@/server/sanity-write-client'
import { eq } from 'drizzle-orm'
import { NonRetriableError } from 'inngest'

import { VIDEO_RESOURCE_CREATED_EVENT } from '@coursebuilder/core/inngest/video-processing/events/event-video-resource'

export const syncVideoResourceToSanity = inngest.createFunction(
	{
		id: 'sync-video-resource-to-sanity',
		name: 'Sync Video Resource to Sanity',
	},
	{
		event: VIDEO_RESOURCE_CREATED_EVENT,
	},
	async ({ event, step }) => {
		const courseBuilderVideoResource = await step.run(
			'Get video resource',
			async () => {
				const videoResource = await db.query.contentResource.findFirst({
					where: eq(contentResource.id, event.data.videoResourceId),
				})

				if (!videoResource) {
					throw new NonRetriableError('Video resource not found')
				}

				return videoResource
			},
		)

		const courseBuilderLesson = await step.run(
			'Get lesson from resource resource',
			async () => {
				const lessonVideoContentResourceResource =
					await db.query.contentResourceResource.findFirst({
						where: eq(
							contentResourceResource.resourceId,
							courseBuilderVideoResource?.id || '',
						),
					})

				return await db.query.contentResource.findFirst({
					where: eq(
						contentResource.id,
						lessonVideoContentResourceResource?.resourceOfId || '',
					),
				})
			},
		)

		const sanityLesson = await step.run('Get lesson from sanity', async () => {
			if (!courseBuilderLesson) return

			return await sanityWriteClient.fetch(
				`*[_type == "lesson" && railsLessonId == ${courseBuilderLesson?.fields?.eggheadLessonId}][0]`,
			)
		})

		const sanityVideoResource = await step.run(
			'Create video resource in sanity',
			async () => {
				if (!courseBuilderVideoResource) return
				const { id, fields } = courseBuilderVideoResource

				const streamUrl =
					fields?.muxPlaybackId &&
					`https://stream.mux.com/${fields?.muxPlaybackId}.m3u8`

				const url = fields?.originalMediaUrl
				const filename = url ? url.substring(url.lastIndexOf('/') + 1) : ''

				const body = sanityVideoResourceDocumentSchema.parse({
					_type: 'videoResource',
					filename,
					muxAsset: {
						muxAssetId: fields?.muxAssetId,
						muxPlaybackId: fields?.muxPlaybackId,
					},
					mediaUrls: {
						hlsUrl: streamUrl,
					},
					transcript: {
						srt: fields?.srt,
						text: fields?.transcript,
					},
				})

				return await sanityWriteClient.create(body)
			},
		)

		await step.run('Update sanity lesson with video resource', async () => {
			if (!sanityLesson?._id || !sanityVideoResource?._id) return

			return await sanityWriteClient
				.patch(sanityLesson._id)
				.set({
					resources: [
						...(sanityLesson?.resources || []),
						{
							_key: keyGenerator(),
							_type: 'reference',
							_ref: sanityVideoResource._id,
						},
					],
				})
				.commit()
		})
	},
)
