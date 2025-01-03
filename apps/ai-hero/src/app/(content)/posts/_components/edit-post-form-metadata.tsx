import * as React from 'react'
import { Suspense, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PostPlayer } from '@/app/(content)/posts/_components/post-player'
import Spinner from '@/components/spinner'
import { env } from '@/env.mjs'
import { useTranscript } from '@/hooks/use-transcript'
import { Post, PostSchema } from '@/lib/posts'
import { addTagToPost, removeTagFromPost } from '@/lib/posts-query'
import type { Tag } from '@/lib/tags'
import { api } from '@/trpc/react'
import { Pencil } from 'lucide-react'
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
} from '@coursebuilder/ui'
import { useSocket } from '@coursebuilder/ui/hooks/use-socket'
import { MetadataFieldState } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-state'
import { MetadataFieldVisibility } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-visibility'
import AdvancedTagSelector from '@coursebuilder/ui/resources-crud/tag-selector'

import { NewLessonVideoForm } from '../../_components/new-lesson-video-form'
import { PostUploader } from './post-uploader'

export const PostMetadataFormFields: React.FC<{
	form: UseFormReturn<z.infer<typeof PostSchema>>
	videoResourceLoader: Promise<VideoResource | null>
	videoResourceId: string | null | undefined
	post: Post
	tagLoader: Promise<Tag[]>
}> = ({
	form,
	videoResourceLoader,
	post,
	videoResourceId: initialVideoResourceId,
	tagLoader,
}) => {
	const router = useRouter()

	const [videoResourceId, setVideoResourceId] = React.useState<
		string | null | undefined
	>(initialVideoResourceId)
	const tags = tagLoader ? use(tagLoader) : []
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

	const [isOpenedTranscriptDialog, setIsOpenedTranscriptDialog] =
		React.useState(false)

	const toggleTranscriptDialog = () =>
		setIsOpenedTranscriptDialog((bool) => !bool)

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
												<PostPlayer videoResource={videoResource} />
												<div className="flex items-center gap-1 px-4 pb-2">
													<Button
														variant="secondary"
														size={'sm'}
														type="button"
														onClick={() => setReplacingVideo(true)}
													>
														Replace Video
													</Button>
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
						availableTags={tags}
						selectedTags={post?.tags?.map((tag) => tag.tag) ?? []}
						onTagSelect={async (tag: { id: string }) => {
							await addTagToPost(post.id, tag.id)
						}}
						onTagRemove={async (tagId: string) => {
							await removeTagFromPost(post.id, tagId)
						}}
					/>
				</div>
			)}
			<FormField
				control={form.control}
				name="fields.description"
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel className="text-lg font-bold">
							SEO Description ({`${field.value?.length ?? '0'} / 160`})
						</FormLabel>
						<FormDescription>
							A short snippet that summarizes the post in under 160 characters.
							Keywords should be included to support SEO.
						</FormDescription>
						<Textarea {...field} value={field.value ?? ''} />
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
