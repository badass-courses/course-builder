'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { fetchRealtimeVideoToken } from '@/app/actions/realtime'
import { useVideoRealtimeSubscription } from '@/hooks/use-video-realtime'
import { api } from '@/trpc/react'

export function Party({ room }: { room?: string }) {
	const utils = api.useUtils()
	const router = useRouter()

	const realtimeEnabled =
		process.env.NEXT_PUBLIC_ENABLE_REALTIME_VIDEO_UPLOAD === 'true' &&
		Boolean(room)

	const subscription = useVideoRealtimeSubscription({
		room,
		enabled: realtimeEnabled,
		refreshToken: (roomId) => fetchRealtimeVideoToken(roomId),
	})

	useMemo(() => {
		if (!realtimeEnabled || !subscription?.latestData) return

		const message = subscription.latestData
		const name = message.data?.name

		const invalidateOn = new Set([
			'videoResource.created',
			'video.asset.ready',
			'transcript.ready',
			'ai.tip.draft.completed',
			'video.asset.detached',
			'video.asset.attached',
		])

		if (name && invalidateOn.has(name)) {
			router.refresh()
		}
	}, [subscription?.latestData, realtimeEnabled, router])

	return null
}
