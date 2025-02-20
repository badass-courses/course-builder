import * as React from 'react'
import { Suspense, use } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Spinner from '@/components/spinner'
import { env } from '@/env.mjs'
import { useTranscript } from '@/hooks/use-transcript'
import type { Post, PostSchema } from '@/lib/posts'
import { updatePost } from '@/lib/posts-query'
import type { Solution } from '@/lib/solutions/solution'
import {
	addSolutionResourceToLesson,
	deleteSolution,
	getSolutionForLesson,
} from '@/lib/solutions/solution-query'
import type { Tag } from '@/lib/tags'
import { api } from '@/trpc/react'
import type { MuxPlayerRefAttributes } from '@mux/mux-player-react'
import { ExternalLink, Shuffle, Trash } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
	Button,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@coursebuilder/ui'
import { useSocket } from '@coursebuilder/ui/hooks/use-socket'
import { MetadataFieldState } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-state'
import { MetadataFieldVisibility } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-visibility'
import AdvancedTagSelector from '@coursebuilder/ui/resources-crud/tag-selector'

import { NewLessonVideoForm } from '../../_components/new-lesson-video-form'
import { AddToList } from './add-to-list'
import { CreatePostModal } from './create-post-modal'
import { SimplePostPlayer } from './post-player'
import { PostUploader } from './post-uploader'

/**
 * Metadata form fields for lesson posts.
 * This variant omits SEO-specific fields.
 */
export const LessonMetadataFormFields: React.FC<{
	form: UseFormReturn<z.infer<typeof PostSchema>>
	videoResourceId?: string | null | undefined
	post: Post
	tagLoader: Promise<Tag[]>
	listsLoader: Promise<any>
	sendResourceChatMessage: (options: {
		resourceId: string
		messages: any[]
		selectedWorkflow?: string
	}) => Promise<void>
}> = ({
	form,
	post,
	videoResourceId: initialVideoResourceId,
	tagLoader,
	listsLoader,
	sendResourceChatMessage,
}) => {
	const router = useRouter()
	const [videoResourceId, setVideoResourceId] = React.useState<
		string | null | undefined
	>(initialVideoResourceId)
	const tags = tagLoader ? use(tagLoader) : []
	const lists = listsLoader ? use(listsLoader) : []

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

				switch (data.name) {
					case 'video.asset.ready':
					case 'videoResource.created':
						if (data.body.id) {
							setVideoResourceId(data.body.id)
						}

						router.refresh()

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

	// Solution handling
	const [solution, setSolution] = React.useState<Solution | null>(null)
	const solutionLoader = React.useCallback(async () => {
		const data = await getSolutionForLesson(post.id)
		setSolution(data)
	}, [post.id])

	React.useEffect(() => {
		solutionLoader()
	}, [solutionLoader])

	const handleDeleteSolution = React.useCallback(async () => {
		if (solution) {
			await deleteSolution(solution.id)
			setSolution(null)
			router.refresh()
		}
	}, [solution, router])

	const [thumbnailTime, setThumbnailTime] = React.useState(0)
	const [showCreateSolutionModal, setShowCreateSolutionModal] =
		React.useState(false)
	const playerRef = React.useRef<MuxPlayerRefAttributes>(null)

	const parsedTagsForUiPackage = z
		.array(
			z.object({
				id: z.string(),
				fields: z.object({
					label: z.string(),
					name: z.string(),
				}),
			}),
		)
		.parse(tags)

	const parsedSelectedTagsForUiPackage = z
		.array(
			z.object({
				tag: z.object({
					id: z.string(),
					fields: z.object({
						label: z.string(),
						name: z.string(),
					}),
				}),
			}),
		)
		.parse(post.tags)

	return (
		<>
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
													thumbnailTime={
														form.watch('fields.thumbnailTime') || 0
													}
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
																			playerRef.current.thumbnailTime =
																				randomTime
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
							<FormLabel className="text-lg font-bold">Video</FormLabel>
							<PostUploader
								setVideoResourceId={setVideoResourceId}
								parentResourceId={post.id}
							/>
						</div>
					)}
				</Suspense>
			</div>
			<FormField
				control={form.control}
				name="id"
				render={({ field }) => <Input type="hidden" {...field} />}
			/>
			<FormField
				control={form.control}
				name="fields.title"
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel className="text-lg font-bold">Title</FormLabel>
						<FormDescription>
							A title should summarize the lesson and explain what it is about
							clearly.
						</FormDescription>
						<Input {...field} />
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="fields.slug"
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel className="text-lg font-bold">Slug</FormLabel>
						<FormDescription>Short with keywords is best.</FormDescription>
						<Input {...field} />
						<FormMessage />
					</FormItem>
				)}
			/>
			{tags?.length > 0 && (
				<div className="px-5">
					<div className="flex w-full items-baseline justify-between">
						<FormLabel className="text-lg font-bold">Tags</FormLabel>
					</div>
					<AdvancedTagSelector
						availableTags={parsedTagsForUiPackage}
						selectedTags={
							parsedSelectedTagsForUiPackage?.map((tag) => tag.tag) ?? []
						}
						onTagSelect={async (tag: { id: string }) => {
							// Add tag logic
						}}
						onTagRemove={async (tagId: string) => {
							// Remove tag logic
						}}
					/>
				</div>
			)}

			{/* Solution Section */}
			<div className="border-muted bg-muted/50 mx-5 mb-6 mt-4 rounded-lg border p-4">
				<div className="flex items-center justify-between">
					<div>
						<h3 className="text-lg font-bold">Solution</h3>
						<p className="text-muted-foreground text-sm">
							{solution
								? 'This lesson has a solution attached:'
								: 'Add a solution to this lesson'}
						</p>
					</div>
				</div>

				{solution ? (
					<div className="mt-4 flex items-center justify-between">
						<div className="font-medium">{solution.fields.title}</div>
						<div className="flex gap-2">
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => router.push(`/posts/${solution.id}/edit`)}
											className="h-8 w-8"
										>
											<ExternalLink className="h-4 w-4" />
										</Button>
									</TooltipTrigger>
									<TooltipContent side="left">
										<p className="text-xs">Edit solution</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>

							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button variant="ghost" size="icon" className="h-8 w-8">
										<Trash className="h-4 w-4" />
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>Delete Solution</AlertDialogTitle>
										<AlertDialogDescription>
											Are you sure you want to delete this solution? This action
											cannot be undone.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>Cancel</AlertDialogCancel>
										<AlertDialogAction onClick={handleDeleteSolution}>
											Delete
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</div>
					</div>
				) : (
					<Button
						variant="secondary"
						className="mt-2"
						onClick={() => setShowCreateSolutionModal(true)}
					>
						Add Solution
					</Button>
				)}
			</div>

			{/* Create Solution Modal */}
			<CreatePostModal
				open={showCreateSolutionModal}
				onOpenChange={setShowCreateSolutionModal}
				showTrigger={false}
				title="Add Solution"
				availableResourceTypes={['solution']}
				defaultResourceType="solution"
				isSolutionContext={true}
				parentLessonId={post.id}
				onResourceCreated={async (resource) => {
					setShowCreateSolutionModal(false)
					await addSolutionResourceToLesson({
						solutionResourceId: resource.id,
						lessonId: post.id,
					})
					await solutionLoader()
					router.refresh()
				}}
			/>

			<MetadataFieldVisibility form={form} />
			<MetadataFieldState form={form} />
		</>
	)
}
