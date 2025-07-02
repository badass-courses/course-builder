'use client'

import { api } from '@/trpc/react'
import MuxPlayer from '@mux/mux-player-react/lazy'

import Spinner from '../spinner'

export default function MDXVideo({
	resourceId,
	thumbnailTime = 0,
	poster,
}: {
	resourceId: string
	thumbnailTime?: number
	poster?: string
}) {
	const { data, status } = api.videoResources.get.useQuery({
		videoResourceId: resourceId,
	})

	if (status === 'pending')
		return (
			<div className="mb-5 flex aspect-video w-full max-w-4xl items-center justify-center rounded-lg border">
				<Spinner className="h-6 w-6" />
			</div>
		)

	if (!data?.muxPlaybackId) return null

	return (
		<div className="flex aspect-video w-full max-w-4xl items-center justify-center overflow-hidden rounded-lg">
			<MuxPlayer
				className="aspect-video w-full"
				playbackRates={[0.75, 1, 1.25, 1.5, 1.75, 2]}
				maxResolution="2160p"
				minResolution="540p"
				accentColor="#926FDD"
				playbackId={data.muxPlaybackId}
				thumbnailTime={thumbnailTime}
				poster={poster}
			/>
		</div>
	)
}
