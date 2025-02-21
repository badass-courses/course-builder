import * as React from 'react'
import { Suspense } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Spinner from '@/components/spinner'
import { env } from '@/env.mjs'
import { useTranscript } from '@/hooks/use-transcript'
import type { Post } from '@/lib/posts'
import { updatePost } from '@/lib/posts-query'
import { api } from '@/trpc/react'
import type { MuxPlayerRefAttributes } from '@mux/mux-player-react'
import { Shuffle } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'

import {
	Button,
	FormLabel,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@coursebuilder/ui'
import { useSocket } from '@coursebuilder/ui/hooks/use-socket'

import { NewLessonVideoForm } from '../../_components/new-lesson-video-form'
import { SimplePostPlayer } from './post-player'
import { PostUploader } from './post-uploader'

/**
 * A shared component for handling video resources in posts.
 * Includes video upload, replacement, thumbnail management, and transcript handling.
 */
export const VideoResourceField: React.FC<{
	form: UseFormReturn<any>
	post: Post
	initialVideoResourceId?: string | null
	label?: string
}> = ({ form, post, initialVideoResourceId, label = 'Video' }) => {
	const router = useRouter()
	const [videoResourceId, setVideoResourceId] = React.useState<
		string | null | undefined
	>(initialVideoResourceId)

	const { data: videoResource, refetch } = api.videoResources.get.useQuery({
		videoResourceId: videoResourceId,
	})

	const [videoUploadStatus, setVideoUploadStatus] = React.useState<
		'loading' | 'finalizing upload'
	>('loading')

	const [replacingVideo, setReplacingVideo] = React.useState(false)

	const {
		transcript,
		setTranscript,
		setIsProcessing: setIsTranscriptProcessing,
		TranscriptDialog,
	} = useTranscript({
		videoResourceId,
		initialTranscript: videoResource?.transcript,
	})

	useSocket({
		room: videoResourceId,
		host: env.NEXT_PUBLIC_PARTY_KIT_URL,
		onMessage: async (messageEvent) => {
			try {
				const data = JSON.parse(messageEvent.data)

				console.log('data', data)

				switch (data.name) {
					case 'video.asset.ready':
					case 'videoResource.created':
						if (data.body.id) {
							setVideoResourceId(data.body.id)
						}

						refetch()

						break
					case 'transcript.ready':
						setTranscript(data.body)
						setIsTranscriptProcessing(false)
						break
					default:
						break
				}
			} catch (error) {
				// nothing to do
			}
		},
	})

	const [thumbnailTime, setThumbnailTime] = React.useState(0)
	const playerRef = React.useRef<MuxPlayerRefAttributes>(null)

	return (
		<div>
			<Suspense
				fallback={
					<div className="bg-muted flex aspect-video h-full w-full flex-col items-center justify-center gap-2 p-5 text-sm">
						<Spinner className="h-4 w-4" />
						<span>video is loading</span>
					</div>
				}
			>
				{videoResourceId ? (
					<>
						{videoResourceId ? (
							replacingVideo ? (
								<div>
									<NewLessonVideoForm
										parentResourceId={post.id}
										onVideoUploadCompleted={(videoResourceId) => {
											setReplacingVideo(false)
											setVideoUploadStatus('finalizing upload')
											setVideoResourceId(videoResourceId)
										}}
										onVideoResourceCreated={(videoResourceId) =>
											setVideoResourceId(videoResourceId)
										}
									/>
									<Button
										variant="ghost"
										type="button"
										onClick={() => setReplacingVideo(false)}
									>
										Cancel Replace Video
									</Button>
								</div>
							) : (
								<>
									{videoResource && videoResource.state === 'ready' ? (
										<div className="-mt-5 border-b">
											<SimplePostPlayer
												ref={playerRef}
												thumbnailTime={form.watch('fields.thumbnailTime') || 0}
												handleVideoTimeUpdate={(e: Event) => {
													const currentTime = (e.target as HTMLMediaElement)
														.currentTime
													if (currentTime) {
														setThumbnailTime(currentTime)
													}
												}}
												videoResource={videoResource}
											/>

											<div className="flex items-center gap-1 px-4 pb-2">
												<Button
													variant="secondary"
													size={'sm'}
													type="button"
													onClick={() => setReplacingVideo(true)}
												>
													Replace Video
												</Button>
												<TooltipProvider>
													<Tooltip delayDuration={0}>
														<div className="flex items-center">
															<TooltipTrigger asChild>
																<Button
																	type="button"
																	className="rounded-r-none"
																	disabled={thumbnailTime === 0}
																	onClick={async () => {
																		form.setValue(
																			'fields.thumbnailTime',
																			thumbnailTime,
																		)

																		await updatePost(
																			{
																				id: post.id,
																				fields: {
																					...post.fields,
																					thumbnailTime: thumbnailTime,
																				},
																			},
																			'save',
																		)
																	}}
																	variant="secondary"
																	size={'sm'}
																>
																	<span>Set Thumbnail</span>
																</Button>
															</TooltipTrigger>
															<Button
																type="button"
																className="border-secondary rounded-l-none border bg-transparent px-2"
																variant="secondary"
																size={'sm'}
																onClick={() => {
																	if (playerRef.current?.seekable) {
																		const seekableEnd =
																			playerRef.current.seekable.end(0)
																		// Generate a random time between 0 and the end of the video
																		const randomTime = Math.floor(
																			Math.random() * seekableEnd,
																		)
																		playerRef.current.currentTime = randomTime
																		playerRef.current.thumbnailTime = randomTime
																	}
																}}
															>
																<Shuffle className="h-3 w-3" />
															</Button>
														</div>
														<TooltipContent side="bottom">
															<div className="text-xs">
																current thumbnail:
																<Image
																	src={`https://image.mux.com/${videoResource.muxPlaybackId}/thumbnail.webp?time=${form.watch('fields.thumbnailTime')}`}
																	className="aspect-video"
																	width={192}
																	height={108}
																	alt="Thumbnail"
																/>
															</div>
														</TooltipContent>
													</Tooltip>
												</TooltipProvider>
												{transcript ? (
													TranscriptDialog
												) : (
													<span className="px-3 text-xs">
														Processing transcript...
													</span>
												)}
											</div>
										</div>
									) : videoResource ? (
										<div className="bg-muted/75 -mt-5 flex aspect-video h-full w-full flex-col items-center justify-center gap-3 p-5 text-sm">
											<Spinner className="h-5 w-5" />
											<span>video is {videoResource.state}</span>
										</div>
									) : (
										<div className="bg-muted/75 -mt-5 flex aspect-video h-full w-full flex-col items-center justify-center gap-3 p-5 text-sm">
											<Spinner className="h-5 w-5" />
											<span>video is {videoUploadStatus}</span>
										</div>
									)}
								</>
							)
						) : (
							<NewLessonVideoForm
								parentResourceId={post.id}
								onVideoUploadCompleted={(videoResourceId) => {
									setVideoUploadStatus('finalizing upload')
									setVideoResourceId(videoResourceId)
								}}
								onVideoResourceCreated={(videoResourceId) =>
									setVideoResourceId(videoResourceId)
								}
							/>
						)}
					</>
				) : (
					<div className="px-5">
						<FormLabel className="text-lg font-bold">{label}</FormLabel>
						<PostUploader
							setVideoResourceId={setVideoResourceId}
							parentResourceId={post.id}
						/>
					</div>
				)}
			</Suspense>
		</div>
	)
}
