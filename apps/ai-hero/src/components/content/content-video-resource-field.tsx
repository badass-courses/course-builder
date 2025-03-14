'use client'

import * as React from 'react'
import { Suspense } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { LessonPlayer } from '@/app/(content)/_components/lesson-player'
import { NewLessonVideoForm } from '@/app/(content)/_components/new-lesson-video-form'
import { SimplePostPlayer } from '@/app/(content)/posts/_components/post-player'
import Spinner from '@/components/spinner'
import { env } from '@/env.mjs'
import { useTranscript } from '@/hooks/use-transcript'
import { api } from '@/trpc/react'
import { pollVideoResource } from '@/utils/poll-video-resource'
import type { MuxPlayerRefAttributes } from '@mux/mux-player-react'
import { Shuffle } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'

import { VideoResource } from '@coursebuilder/core/schemas'
import {
	Button,
	FormDescription,
	FormLabel,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@coursebuilder/ui'
import { useSocket } from '@coursebuilder/ui/hooks/use-socket'

/**
 * Base interface that any content resource must implement
 */
interface ContentResourceBase {
	id: string
	fields: {
		[key: string]: any
		title?: string
		thumbnailTime?: number | null
	}
}

/**
 * Props interface for the ContentVideoResourceField component
 */
interface ContentVideoResourceFieldProps<T extends ContentResourceBase> {
	/**
	 * The content resource (post, lesson, solution, etc.)
	 */
	resource: T

	/**
	 * The form instance from react-hook-form
	 */
	form: UseFormReturn<any>

	/**
	 * Video resource object to display
	 */
	videoResource?: VideoResource | null

	/**
	 * Label to display for the video field
	 */
	label?: string

	/**
	 * Callback when video is updated
	 * Receives resource ID, video resource ID, and optional additional fields
	 */
	onVideoUpdate?: (
		resourceId: string,
		videoResourceId: string,
		additionalFields?: Record<string, any>,
	) => Promise<void>

	/**
	 * Whether thumbnail selection is enabled
	 */
	thumbnailEnabled?: boolean

	/**
	 * Whether to show transcript
	 */
	showTranscript?: boolean

	/**
	 * Optional className to apply to the container
	 */
	className?: string

	/**
	 * Whether video is required
	 */
	required?: boolean
}

/**
 * A generic video resource field component that works with any content resource
 * Handles video upload, replacement, and optionally thumbnail selection
 */
export const ContentVideoResourceField = <T extends ContentResourceBase>({
	resource,
	form,
	videoResource: initialVideoResource,
	label = 'Video',
	thumbnailEnabled = false,
	showTranscript = true,
	className = '',
	required = false,
	onVideoUpdate,
}: ContentVideoResourceFieldProps<T>) => {
	const router = useRouter()

	const { data: videoResource, refetch } = api.videoResources.get.useQuery(
		{
			videoResourceId: initialVideoResource?.id,
		},
		{
			enabled: !!initialVideoResource?.id,
		},
	)

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
		videoResourceId: videoResource?.id,
		initialTranscript: videoResource?.transcript,
	})

	// Reference for player when thumbnail functionality is enabled
	const playerRef = React.useRef<MuxPlayerRefAttributes>(null)
	const [thumbnailTime, setThumbnailTime] = React.useState(
		form.watch('fields.thumbnailTime') || 0,
	)

	// Socket connection for video and transcript updates
	useSocket({
		room: videoResource?.id,
		host: env.NEXT_PUBLIC_PARTY_KIT_URL,
		onMessage: async (messageEvent) => {
			try {
				const data = JSON.parse(messageEvent.data)

				switch (data.name) {
					case 'video.asset.ready':
					case 'videoResource.created':
						if (data.body.id) {
							refetch()
						}
						break
					case 'transcript.ready':
						setTranscript(data.body)
						setIsTranscriptProcessing(false)
						refetch()
						break
					case 'video.asset.attached':
						refetch()
						break
					case 'video.asset.detached':
						refetch()
						break
					default:
						break
				}
			} catch (error) {
				// nothing to do
			}
		},
	})

	// Effect to poll video resource until it's ready
	React.useEffect(() => {
		async function pollVideo() {
			if (videoResource?.id) {
				await pollVideoResource(videoResource.id).next()
				refetch()
			}
		}

		if (!['ready', 'errored'].includes(videoResource?.state || '')) {
			pollVideo()
		}
	}, [videoResource?.state, videoResource?.id, refetch])

	return (
		<div className={className}>
			{videoResource?.id || initialVideoResource?.id ? (
				replacingVideo ? (
					<div className="-mt-7">
						<NewLessonVideoForm
							parentResourceId={resource.id}
							onVideoUploadCompleted={(videoResourceId) => {
								setReplacingVideo(false)
								setVideoUploadStatus('finalizing upload')
								refetch()
							}}
							onVideoResourceCreated={(videoResourceId) => {
								refetch()
							}}
						/>
						<div className="flex items-center gap-1 border-b px-4 py-2">
							<Button
								variant="secondary"
								size={'sm'}
								type="button"
								onClick={() => setReplacingVideo(false)}
							>
								Cancel Replace Video
							</Button>
						</div>
					</div>
				) : (
					<>
						{videoResource && videoResource.state === 'ready' ? (
							<div className="-mt-5 border-b">
								<div className="flex items-center justify-center">
									{thumbnailEnabled ? (
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
									) : (
										<LessonPlayer
											title={resource.fields?.title}
											videoResource={videoResource}
										/>
									)}
								</div>
								<div className="flex items-center gap-1 px-4 py-2">
									<Button
										variant="secondary"
										size={'sm'}
										type="button"
										onClick={() => setReplacingVideo(true)}
									>
										Replace Video
									</Button>

									{thumbnailEnabled && (
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

																if (onVideoUpdate) {
																	await onVideoUpdate(
																		resource.id,
																		videoResource.id,
																		{ thumbnailTime },
																	)
																}
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
									)}

									{showTranscript && transcript && TranscriptDialog}
								</div>
							</div>
						) : videoResource ? (
							<div className="bg-muted/75 -mt-5 mb-[42px] flex aspect-video h-full w-full flex-col items-center justify-center gap-3 p-5 text-sm">
								<Spinner className="h-5 w-5" />
								<span>video is {videoResource.state}</span>
							</div>
						) : (
							<div className="bg-muted/75 -mt-5 mb-[42px] flex aspect-video h-full w-full flex-col items-center justify-center gap-3 p-5 text-sm">
								<Spinner className="h-5 w-5" />
								<span>video is {videoUploadStatus}</span>
							</div>
						)}
					</>
				)
			) : (
				<div className="-mt-7">
					<NewLessonVideoForm
						parentResourceId={resource.id}
						onVideoUploadCompleted={(videoResourceId) => {
							setVideoUploadStatus('finalizing upload')
							refetch()
						}}
						onVideoResourceCreated={(videoResourceId) => {
							refetch()
						}}
					/>
					{!videoResource?.id && (
						<div className="flex items-baseline gap-3 border-b px-5 py-2">
							<FormLabel className="text-base font-bold">{label}</FormLabel>
							{!required && (
								<FormDescription className="pb-0">
									Add a video for this content (optional).
								</FormDescription>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	)
}
