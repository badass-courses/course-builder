'use client'

import { useRouter } from 'next/navigation'
import { useSocket } from '@/hooks/use-socket'
import { api } from '@/trpc/react'

export function Party({ room }: { room?: string }) {
	const utils = api.useUtils()
	const router = useRouter()
	useSocket({
		room,
		onMessage: async (messageEvent) => {
			try {
				const data = JSON.parse(messageEvent.data)
				const invalidateOn = [
					'videoResource.created',
					'video.asset.ready',
					'transcript.ready',
					'ai.tip.draft.completed',
					'video.asset.detached',
					'video.asset.attached',
				]

				if (invalidateOn.includes(data.name)) {
					router.refresh()
				}
			} catch (error) {
				// noting to do
			}
		},
	})

	return null
}
