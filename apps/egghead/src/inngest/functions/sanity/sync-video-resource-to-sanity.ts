import { courseBuilderAdapter } from '@/db'
import { inngest } from '@/inngest/inngest.server'
import {
	createSanityVideoResource,
	patchSanityLessonWithVideoResourceReference,
} from '@/lib/sanity-content-query'
import { getResourceOfVideoResource } from '@/lib/video-resource-query'
import { NonRetriableError } from 'inngest'

import { VIDEO_RESOURCE_CREATED_EVENT } from '@coursebuilder/core/inngest/video-processing/events/event-video-resource'
import type { VideoResource } from '@coursebuilder/core/schemas'

export const syncVideoResourceToSanity = inngest.createFunction(
	{
		id: 'sync-video-resource-to-sanity',
		name: 'Sync Video Resource to Sanity',
	},
	{
		event: VIDEO_RESOURCE_CREATED_EVENT,
	},
	async ({ event, step }) => {
		const courseBuilderVideoResource = (await step.run(
			'Get video resource',
			async () => {
				const videoResource = await courseBuilderAdapter.getVideoResource(
					event.data.videoResourceId,
				)

				if (!videoResource) {
					throw new NonRetriableError('Video resource not found')
				}

				return videoResource
			},
		)) as VideoResource

		const sanityVideoResourceDocument = await step.run(
			'Create video resource in sanity',
			async () => {
				return await createSanityVideoResource(courseBuilderVideoResource)
			},
		)

		await step.run(
			'Associate video document with lesson via reference',
			async () => {
				const post = await getResourceOfVideoResource(
					courseBuilderVideoResource.id,
				)

				return patchSanityLessonWithVideoResourceReference(
					post?.fields?.eggheadLessonId,
					sanityVideoResourceDocument._id,
				)
			},
		)
	},
)
