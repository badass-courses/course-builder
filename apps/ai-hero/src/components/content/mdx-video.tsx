'use client'

import Image from 'next/image'
import { api } from '@/trpc/react'
import type { MuxPlayerProps } from '@mux/mux-player-react'
import MuxPlayer from '@mux/mux-player-react'

import { cn } from '@coursebuilder/ui/utils/cn'

import Spinner from '../spinner'

export default function MDXVideo({
	resourceId,
	thumbnailTime = 0,
	poster,
	className,
	props,
}: {
	resourceId: string
	thumbnailTime?: number
	poster?: string
	className?: string
	props?: MuxPlayerProps
}) {
	const { data, status } = api.videoResources.get.useQuery({
		videoResourceId: resourceId,
	})

	if (status === 'pending')
		return (
			<div
				className={cn(
					'not-prose relative mb-5 flex aspect-video w-full max-w-4xl items-center justify-center overflow-hidden rounded-lg border',
					className,
				)}
			>
				<Spinner className="relative z-10 h-6 w-6" />
				{poster && (
					<Image
						src={poster}
						alt={''}
						aria-hdden="true"
						fill
						className="object-fill opacity-25"
					/>
				)}
			</div>
		)

	if (!data?.muxPlaybackId) return null

	return (
		<div
			className={cn(
				'flex aspect-video w-full max-w-4xl items-center justify-center overflow-hidden rounded-lg',
				className,
			)}
		>
			<MuxPlayer
				streamType="on-demand"
				className="aspect-video w-full"
				playbackRates={[0.75, 1, 1.25, 1.5, 1.75, 2]}
				maxResolution="2160p"
				minResolution="540p"
				accentColor="#DD9637"
				playbackId={data.muxPlaybackId}
				thumbnailTime={thumbnailTime}
				poster={poster}
				playsInline
				{...props}
			/>
		</div>
	)
}
