import { notFound } from 'next/navigation'
import { getCachedPostOrList } from '@/lib/posts-query'
import { getCachedVideoResource } from '@/lib/video-resource-query'

import { type VideoResource } from '@coursebuilder/core/schemas'

import { EmbedPlayer } from './_components/player'

type Props = {
	params: Promise<{ slug: string }>
}

export default async function PostEmbedPage(props: Props) {
	const params = await props.params
	const post = await getCachedPostOrList(params.slug)

	if (!post || post.type !== 'post') {
		notFound()
	}

	// Find the video resource
	const primaryVideo = post.resources?.find(
		({ resource }) => resource.type === 'videoResource',
	)

	if (!primaryVideo) {
		return (
			<div className="flex h-screen w-full items-center justify-center bg-gray-900 text-white">
				<div className="text-center">
					<p className="text-lg font-medium">No video available</p>
					<p className="mt-1 text-sm text-gray-400">
						This post doesn't contain a video
					</p>
				</div>
			</div>
		)
	}

	const videoDetails: VideoResource | null = await getCachedVideoResource(
		primaryVideo.resource.id,
	)

	if (!videoDetails) {
		return (
			<div className="flex h-screen w-full items-center justify-center bg-gray-900 text-white">
				<div className="text-center">
					<p className="text-lg font-medium">Video not found</p>
					<p className="mt-1 text-sm text-gray-400">
						The video resource could not be loaded
					</p>
				</div>
			</div>
		)
	}

	const playbackId = videoDetails.muxPlaybackId

	if (!playbackId) {
		return (
			<div className="flex h-screen w-full items-center justify-center bg-gray-900 text-white">
				<div className="text-center">
					<p className="text-lg font-medium">Video Processing</p>
					<p className="mt-1 text-sm text-gray-400">
						Please try again in a few minutes
					</p>
				</div>
			</div>
		)
	}

	return (
		<EmbedPlayer
			playbackId={playbackId}
			videoDetails={videoDetails}
			postTitle={post.fields.title}
			thumbnailTime={post.fields?.thumbnailTime || 0}
		/>
	)
}
