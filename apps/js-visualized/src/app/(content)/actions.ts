'use server'

import { revalidatePath } from 'next/cache'
import { courseBuilderAdapter } from '@/db'
import { inngest } from '@/inngest/inngest.server'
import { getServerAuthSession } from '@/server/auth'
import pluralize from 'pluralize'

import { VIDEO_RESOURCE_CREATED_EVENT } from '@coursebuilder/core/inngest/video-processing/events/event-video-resource'

export async function reprocessTranscript({
	videoResourceId,
}: {
	videoResourceId?: string | null
}) {
	// template for the url to download the mp4 file from mux
	// https://stream.mux.com/{PLAYBACK_ID}/{MP4_FILE_NAME}?download={FILE_NAME}
	const { session, ability } = await getServerAuthSession()

	if (!session || !ability.can('create', 'Content')) {
		throw new Error('Unauthorized')
	}

	const videoResource =
		await courseBuilderAdapter.getVideoResource(videoResourceId)

	if (videoResource?.id) {
		await inngest.send({
			name: VIDEO_RESOURCE_CREATED_EVENT,
			data: {
				videoResourceId: videoResource.id,
				originalMediaUrl: `https://stream.mux.com/${videoResource.muxPlaybackId}/low.mp4?download=${videoResource.id}`,
			},
			user: session.user,
		})
	}
}

export async function revalidateModuleLesson(
	moduleSlug: string,
	lessonSlug: string,
	moduleType: string = 'tutorial',
	lessonType?: 'lesson' | 'exercise' | 'solution',
) {
	return revalidatePath(
		`/${pluralize(moduleType)}/${moduleSlug}/${lessonSlug}${lessonType === 'exercise' ? '/exercise' : ''}${lessonType === 'solution' ? '/solution' : ''}`,
	)
}

export async function removeResourceFromResource(
	videoResourceId: string,
	parentResourceId: string,
) {
	const { session, ability } = await getServerAuthSession()

	if (!session || !ability.can('create', 'Content')) {
		throw new Error('Unauthorized')
	}

	const videoResource =
		await courseBuilderAdapter.getVideoResource(videoResourceId)
	const parentResource =
		await courseBuilderAdapter.getContentResource(parentResourceId)

	if (videoResource && parentResource) {
		await courseBuilderAdapter.removeResourceFromResource({
			childResourceId: videoResourceId,
			parentResourceId: parentResourceId,
		})
	}
}
