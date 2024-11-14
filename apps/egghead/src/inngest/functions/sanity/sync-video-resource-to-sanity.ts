import { db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import { inngest } from '@/inngest/inngest.server'
import { createClient } from '@sanity/client'
import { and, eq, sql } from 'drizzle-orm'
import { NonRetriableError } from 'inngest'
import { z } from 'zod'

import { VIDEO_RESOURCE_CREATED_EVENT } from '@coursebuilder/core/inngest/video-processing/events/event-video-resource'

export const sanityWriteClient = createClient({
	projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
	dataset: process.env.NEXT_PUBLIC_SANITY_DATASET_ID || 'production',
	useCdn: false, // `false` if you want to ensure fresh data
	apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
	token: process.env.SANITY_EDITOR_TOKEN,
})

export const sanityVideoResourceDocumentSchema = z.object({
	_createdAt: z.string().datetime().optional(),
	_id: z.string().optional(),
	_rev: z.string().optional(),
	_type: z.literal('videoResource'),
	_updatedAt: z.string().datetime().optional(),
	filename: z.string().optional(),
	mediaUrls: z.object({
		hlsUrl: z.string(),
		dashUrl: z.string().optional(),
	}),
	muxAsset: z
		.object({
			muxAssetId: z.string().optional(),
			muxPlaybackId: z.string().optional(),
		})
		.optional(),
	transcript: z
		.object({
			srt: z.string(),
			text: z.string(),
		})
		.optional(),
})

const keyGenerator = () => {
	return [...Array(12)]
		.map(() => Math.floor(Math.random() * 16).toString(16))
		.join('')
}

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
