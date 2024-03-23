'use server'

import { getAbility } from '@/ability'
import { inngest } from '@/inngest/inngest.server'
import { getVideoResource } from '@/lib/video-resource-query'
import { getServerAuthSession } from '@/server/auth'

import { VIDEO_RESOURCE_CREATED_EVENT } from '@coursebuilder/core/inngest/video-processing/events/event-video-resource'

export async function reprocessTranscript({
	videoResourceId,
}: {
	videoResourceId?: string | null
}) {
	// template for the url to download the mp4 file from mux
	// https://stream.mux.com/{PLAYBACK_ID}/{MP4_FILE_NAME}?download={FILE_NAME}
	const session = await getServerAuthSession()
	const ability = getAbility({ user: session?.user })

	if (!session || !ability.can('create', 'Content')) {
		throw new Error('Unauthorized')
	}

	const videoResource = await getVideoResource(videoResourceId)

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
