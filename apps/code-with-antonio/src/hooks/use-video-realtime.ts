'use client'

import type { VideoRealtimeToken } from '@/app/actions/realtime'
import { useInngestSubscription } from '@inngest/realtime/hooks'

import { videoChannel } from '@coursebuilder/core/inngest/video-processing/realtime'

type RefreshTokenFn = (roomId: string) => Promise<VideoRealtimeToken>

export function useVideoRealtimeSubscription({
	room,
	refreshToken,
	enabled,
}: {
	room?: string | null
	refreshToken: RefreshTokenFn
	enabled?: boolean
}) {
	const finalRoom = room ?? ''
	const realtimeEnabled = enabled && Boolean(finalRoom)

	const subscription = useInngestSubscription({
		enabled: realtimeEnabled,
		refreshToken: async () => {
			return refreshToken(finalRoom)
		},
		channel: () => videoChannel(finalRoom),
		topics: ['status'],
	})

	return subscription
}
