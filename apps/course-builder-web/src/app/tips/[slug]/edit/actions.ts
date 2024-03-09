'use server'

import { inngest } from '@/inngest/inngest.server'
import { VIDEO_RESOURCE_CREATED_EVENT } from '@/inngest/video-processing/events/video-resource'
import { getAbility } from '@/lib/ability'
import { getVideoResource } from '@/lib/video-resource-query'
import { getServerAuthSession } from '@/server/auth'

export async function reprocessTranscript({ videoResourceId }: { videoResourceId?: string | null }) {
  // template for the url to download the mp4 file from mux
  // https://stream.mux.com/{PLAYBACK_ID}/{MP4_FILE_NAME}?download={FILE_NAME}
  const session = await getServerAuthSession()
  const ability = getAbility({ user: session?.user })

  if (!session || !ability.can('create', 'Content')) {
    throw new Error('Unauthorized')
  }

  const videoResource = await getVideoResource(videoResourceId)

  if (videoResource?._id) {
    await inngest.send({
      name: VIDEO_RESOURCE_CREATED_EVENT,
      data: {
        videoResourceId: videoResource._id,
        originalMediaUrl: `https://stream.mux.com/${videoResource.muxPlaybackId}/low.mp4?download=${videoResource._id}`,
      },
      user: session.user,
    })
  }
}
