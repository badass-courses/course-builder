import * as React from 'react'
import { Suspense, use } from 'react'
import { useRouter } from 'next/navigation'
import { PostPlayer } from '@/app/(content)/posts/_components/post-player'
import { reprocessTranscript } from '@/app/(content)/posts/[slug]/edit/actions'
import { env } from '@/env.mjs'
import { useTranscript } from '@/hooks/use-transcript'
import { Post, PostSchema } from '@/lib/posts'
import { api } from '@/trpc/react'
import { RefreshCcw } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'
import ReactMarkdown from 'react-markdown'
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

import { NewLessonVideoForm } from '../../_components/new-lesson-video-form'
import { PostUploader } from './post-uploader'

export const PostMetadataFormFields: React.FC<{
	form: UseFormReturn<z.infer<typeof PostSchema>>
	videoResourceLoader: Promise<VideoResource | null>
	videoResourceId: string | null | undefined
	post: Post
}> = ({
	form,
	videoResourceLoader,
	post,
	videoResourceId: initialVideoResourceId,
}) => {
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

	const [transcript, setTranscript] = useTranscript({
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
						break
					default:
						break
				}
			} catch (error) {
				// nothing to do
			}
		},
	})
	return (
		<>
			<div>
				{videoResourceId && videoResource ? (
					<Suspense
						fallback={
							<>
								<div className="bg-muted flex aspect-video h-full w-full items-center justify-center p-5">
									video is loading
								</div>
							</>
						}
					>
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
										<div>
											<PostPlayer videoResource={videoResource} />
											<Button
												variant="ghost"
												type="button"
												onClick={() => setReplacingVideo(true)}
											>
												Replace Video
											</Button>
										</div>
									) : videoResource ? (
										<div className="bg-muted flex aspect-video h-full w-full items-center justify-center p-5">
											video is {videoResource.state}
										</div>
									) : (
										<div className="bg-muted flex aspect-video h-full w-full items-center justify-center p-5">
											video is {videoUploadStatus}
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
					</Suspense>
				) : (
					<div className="px-5">
						<FormLabel className="text-lg font-bold">Video</FormLabel>
						<PostUploader
							setVideoResourceId={setVideoResourceId}
							parentResourceId={post.id}
						/>
					</div>
				)}
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
			{videoResource && (
				<div className="px-5">
					<div className="flex items-center justify-between gap-2">
						<label className="text-lg font-bold">Transcript</label>
						{Boolean(videoResourceId) && (
							<TooltipProvider delayDuration={0}>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="ghost"
											size="icon"
											type="button"
											onClick={async (event) => {
												event.preventDefault()
												await reprocessTranscript({ videoResourceId })
											}}
											title="Reprocess"
										>
											<RefreshCcw className="w-3" />
										</Button>
									</TooltipTrigger>
									<TooltipContent side="top">
										Reprocess Transcript
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						)}
					</div>
					<ReactMarkdown className="prose prose-sm dark:prose-invert before:from-background relative mt-3 h-48 max-w-none overflow-hidden before:absolute before:bottom-0 before:left-0 before:z-10 before:h-24 before:w-full before:bg-gradient-to-t before:to-transparent before:content-[''] md:h-auto md:before:h-0">
						{transcript ? transcript : 'Transcript Processing'}
					</ReactMarkdown>
				</div>
			)}
		</>
	)
}
