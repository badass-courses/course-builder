'use server'

import { inngest } from '@/inngest/inngest.server'
import { getSubscriptionToken, type Realtime } from '@inngest/realtime'

import { videoChannel } from '@coursebuilder/core/inngest/video-processing/realtime'

export type VideoRealtimeToken = Realtime.Token<typeof videoChannel, ['status']>

export async function fetchRealtimeVideoToken(
	roomId: string,
): Promise<VideoRealtimeToken> {
	if (!roomId) {
		throw new Error('roomId is required to fetch realtime token')
	}

	return await getSubscriptionToken(inngest, {
		channel: videoChannel(roomId),
		topics: ['status'],
	})
}
