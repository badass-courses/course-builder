import * as React from 'react'
import { Suspense, use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SimplePostPlayer } from '@/app/(content)/posts/_components/post-player'
import Spinner from '@/components/spinner'
import { env } from '@/env.mjs'
import { useTranscript } from '@/hooks/use-transcript'
import type { List } from '@/lib/lists'
import { Post, PostSchema } from '@/lib/posts'
import { addTagToPost, removeTagFromPost, updatePost } from '@/lib/posts-query'
import type { Tag } from '@/lib/tags'
import { api } from '@/trpc/react'
import type { MuxPlayerRefAttributes } from '@mux/mux-player-react'
import { Pencil, Shuffle, Sparkles } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import { VideoResource } from '@coursebuilder/core/schemas/video-resource'
import {
	Button,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	Textarea,
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
import { PostUploader } from './post-uploader'

export const PostMetadataFormFields: React.FC<{
	form: UseFormReturn<z.infer<typeof PostSchema>>
	videoResourceLoader: Promise<VideoResource | null>
	videoResourceId: string | null | undefined
	post: Post
	tagLoader: Promise<Tag[]>
	listsLoader: Promise<List[]>
	sendResourceChatMessage: (options: {
		resourceId: string
		messages: any[]
		selectedWorkflow?: string
	}) => Promise<void>
}> = ({
	form,
	videoResourceLoader,
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

	const [isGeneratingDescription, setIsGeneratingDescription] =
		React.useState(false)

	useSocket({
		room: post.id,
		host: env.NEXT_PUBLIC_PARTY_KIT_URL,
		onMessage: async (messageEvent) => {
			try {
				const data = JSON.parse(messageEvent.data)

				if (
					data.name === 'resource.chat.completed' &&
					data.requestId === post.id &&
					data.metadata?.workflow === 'prompt-0541t'
				) {
					const lastMessage = data.body[data.body.length - 1]
					if (lastMessage?.content) {
						const description = lastMessage.content.replace(
							/```.*\n(.*)\n```/s,
							'$1',
						)
						form.setValue('fields.description', description)
					}
					setIsGeneratingDescription(false)
				}
			} catch (error) {
				setIsGeneratingDescription(false)
			}
		},
	})

	const [isOpenedTranscriptDialog, setIsOpenedTranscriptDialog] =
		React.useState(false)

	const toggleTranscriptDialog = () =>
		setIsOpenedTranscriptDialog((bool) => !bool)

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

	const [thumbnailTime, setThumbnailTime] = React.useState(0)

	const handleGenerateDescription = async () => {
		setIsGeneratingDescription(true)

		await sendResourceChatMessage({
			resourceId: post.id,
			messages: [
				{
					role: 'user',
					content: `Generate a SEO-friendly description for this post. The description should be under 160 characters, include relevant keywords, and be compelling for search results.`,
				},
			],
			selectedWorkflow: 'prompt-0541t',
		})
	}

	const playerRef = React.useRef<MuxPlayerRefAttributes>(null)

	return (
		<>
			<div>
				<Suspense
					fallback={
						<>
							<div className="bg-muted flex aspect-video h-full w-full flex-col items-center justify-center gap-2 p-5 text-sm">
								<Spinner className="h-4 w-4" />
								<span>video is loading</span>
							</div>
						</>
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
													handleVideoTimeUpdate={(e) => {
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
							A title should summarize the post and explain what it is about
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
						<Button
							variant="ghost"
							size="sm"
							className="flex items-center gap-1 opacity-75 hover:opacity-100"
							asChild
						>
							<Link href="/admin/tags">
								<Pencil className="h-3 w-3" /> Edit
							</Link>
						</Button>
					</div>
					<AdvancedTagSelector
						availableTags={parsedTagsForUiPackage}
						selectedTags={
							parsedSelectedTagsForUiPackage?.map((tag) => tag.tag) ?? []
						}
						onTagSelect={async (tag: { id: string }) => {
							await addTagToPost(post.id, tag.id)
						}}
						onTagRemove={async (tagId: string) => {
							await removeTagFromPost(post.id, tagId)
						}}
					/>
				</div>
			)}
			<AddToList lists={lists} post={post} />
			<FormField
				control={form.control}
				name="fields.description"
				render={({ field }) => (
					<FormItem className="px-5">
						<div className="flex items-center justify-between">
							<FormLabel className="text-lg font-bold leading-none">
								SEO Description
								<br />
								<span className="text-muted-foreground text-sm tabular-nums">
									({`${field.value?.length ?? '0'} / 160`})
								</span>
							</FormLabel>
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="flex items-center gap-1"
								disabled={isGeneratingDescription}
								onClick={handleGenerateDescription}
							>
								{isGeneratingDescription ? (
									<Spinner className="h-4 w-4" />
								) : (
									<Sparkles className="h-4 w-4" />
								)}
								Generate
							</Button>
						</div>
						<FormDescription>
							A short snippet that summarizes the post in under 160 characters.
							Keywords should be included to support SEO.
						</FormDescription>
						<Textarea rows={4} {...field} value={field.value ?? ''} />
						{field.value && field.value.length > 160 && (
							<FormMessage>
								Your description is longer than 160 characters
							</FormMessage>
						)}
						<FormMessage />
					</FormItem>
				)}
			/>
			<MetadataFieldVisibility form={form} />
			<MetadataFieldState form={form} />
			<FormField
				control={form.control}
				name="fields.github"
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel className="text-lg font-bold">GitHub</FormLabel>
						<FormDescription>
							Direct link to the GitHub file associated with the post.
						</FormDescription>
						<Input {...field} value={field.value ?? ''} />
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="fields.gitpod"
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel className="text-lg font-bold">Gitpod</FormLabel>
						<FormDescription>
							Gitpod link to start a new workspace with the post.
						</FormDescription>
						<Input {...field} value={field.value ?? ''} />
						<FormMessage />
					</FormItem>
				)}
			/>
		</>
	)
}
