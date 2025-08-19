import * as React from 'react'
import { Suspense, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PostPlayer } from '@/app/(content)/posts/_components/post-player'
import { reprocessTranscript } from '@/app/(content)/posts/[slug]/edit/actions'
import { NewLessonVideoForm } from '@/components/resources-crud/new-lesson-video-form'
import { env } from '@/env.mjs'
import { useTranscript } from '@/hooks/use-transcript'
import {
	Post,
	POST_TYPES_WITH_VIDEO,
	PostSchema,
	PostTypeSchema,
} from '@/lib/posts'
import {
	addTagToPost,
	removeTagFromPost,
	setPrimaryTagToPost,
	updatePostInstructor,
} from '@/lib/posts-query'
import { EggheadTag } from '@/lib/tags'
import { CompactInstructor } from '@/lib/users'
import { api } from '@/trpc/react'
import { getOGImageUrlForResourceAPI } from '@/utils/get-og-image-url-for-resource'
import { RefreshCcw } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'
import ReactMarkdown from 'react-markdown'
import { z } from 'zod'

import { VideoResource } from '@coursebuilder/core/schemas/video-resource'
import {
	Button,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Textarea,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@coursebuilder/ui'
import { useSocket } from '@coursebuilder/ui/hooks/use-socket'
import { MetadataFieldState } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-state'
import { MetadataFieldVisibility } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-visibility'
import AdvancedTagSelectorWithPrimary from '@coursebuilder/ui/resources-crud/tag-selector-with-primary'

import InstructorSelector from './instructor-selector'
import { MetadataFieldAccess } from './metadata-field-access'
import { MetadataFieldogImage } from './metadata-field-social-image'

export const PostMetadataFormFields: React.FC<{
	form: UseFormReturn<z.infer<typeof PostSchema>>
	videoResourceLoader: Promise<VideoResource | null>
	videoResourceId: string | null | undefined
	post: Post
	tagLoader: Promise<EggheadTag[]>
	instructorLoader: Promise<CompactInstructor[]>
	isAdmin: boolean
}> = ({
	form,
	videoResourceLoader,
	videoResourceId: initialVideoResourceId,
	post,
	tagLoader,
	instructorLoader,
	isAdmin,
}) => {
	const router = useRouter()
	const tags = tagLoader ? use(tagLoader) : []

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
						refetch()
						break
					case 'transcript.ready':
						setTranscript(data.body)
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

	const primaryTagImageUrl = post.tags?.find(
		(tagRow) => tagRow.tagId === post.fields.primaryTagId,
	)?.tag?.fields?.image_url
	return (
		<>
			{POST_TYPES_WITH_VIDEO.includes(post.fields.postType) && (
				<div>
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
				</div>
			)}
			<FormField
				control={form.control}
				name="id"
				render={({ field }) => <Input type="hidden" {...field} />}
			/>
			{post.fields.postType === 'course' && (
				<>
					<div className="max-w-xs px-5">
						<FormLabel className="text-lg font-bold peer-disabled:cursor-not-allowed">
							Cover Image
						</FormLabel>
						{form.watch('fields.image') ? (
							<img src={form.watch('fields.image') as string} />
						) : (
							<div className="flex aspect-square flex-col items-center justify-center p-5 text-center">
								<img src={primaryTagImageUrl} />
								<span className="text-muted-foreground mt-2 text-sm">
									Defaulting to primary tag image
								</span>
							</div>
						)}
					</div>
				</>
			)}
			{isAdmin && post.fields.postType === 'course' && (
				<FormField
					control={form.control}
					name="fields.image"
					render={({ field }) => (
						<FormItem className="px-5">
							<FormLabel>Image URL</FormLabel>
							<Input
								{...field}
								onDrop={(e) => {
									e.preventDefault()
									const result = e.dataTransfer.getData('text/plain')
									// Check if it's a markdown image format
									const markdownMatch = result.match(/\(([^)]+)\)/)
									if (markdownMatch) {
										field.onChange(markdownMatch[1])
									} else {
										// If not markdown, use the plain text URL
										field.onChange(result)
									}
								}}
								value={field.value || ''}
							/>
							<FormMessage />
						</FormItem>
					)}
				/>
			)}
			<FormField
				control={form.control}
				name="fields.postType"
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel className="text-lg font-bold">Type</FormLabel>
						<Select
							onValueChange={field.onChange}
							defaultValue={field.value}
							disabled={!isAdmin}
						>
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder="Choose state" />
								</SelectTrigger>
							</FormControl>
							<SelectContent className="">
								{PostTypeSchema.options.map((option) => {
									const value = option._def.value
									return (
										<SelectItem key={value} value={value}>
											{value}
										</SelectItem>
									)
								})}
							</SelectContent>
						</Select>
						<FormMessage />
					</FormItem>
				)}
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
			<div className="px-5">
				<FormLabel className="text-lg font-bold">Tags</FormLabel>
				<FormDescription>
					The selected tag will be used as the primary tag for the post.
				</FormDescription>
				<AdvancedTagSelectorWithPrimary
					availableTags={tags}
					selectedTags={post?.tags?.map((tag) => tag.tag) ?? []}
					primaryTagId={post?.fields?.primaryTagId ?? ''}
					onTagSelect={async (tag: { id: string }) => {
						await addTagToPost(post.id, tag.id)
						router.refresh()
					}}
					onTagRemove={async (tagId: string) => {
						await removeTagFromPost(post.id, tagId)
					}}
					onPrimaryTagSelect={async (tagId: string) => {
						await setPrimaryTagToPost(post.id, tagId)
					}}
				/>
			</div>
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

			<MetadataFieldogImage form={form} post={post} hidden={false} />

			<MetadataFieldVisibility form={form} />
			<MetadataFieldAccess form={form} />
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

			{isAdmin && (
				<div className="px-5">
					<FormLabel className="text-lg font-bold">Instructor</FormLabel>
					<FormDescription>Instructor who created the post.</FormDescription>
					<InstructorSelector
						instructorLoader={instructorLoader}
						selectedInstructorId={post.createdById}
						onInstructorSelect={async (instructor) => {
							await updatePostInstructor(post.id, instructor.id)
							router.refresh()
						}}
					/>
				</div>
			)}

			{videoResource && (
				<div className="px-5">
					<div className="flex items-center justify-between gap-2">
						<div className="flex items-center gap-2">
							<label className="text-lg font-bold">Transcript</label>
							<Link
								href={`/posts/${post.fields?.slug}/edit/transcript`}
								className="text-sm text-blue-500 hover:text-blue-700"
							>
								Edit
							</Link>
						</div>
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
					<ReactMarkdown className="prose prose-sm dark:prose-invert before:from-background before:bg-linear-to-t relative mt-3 h-48 max-w-none overflow-hidden before:absolute before:bottom-0 before:left-0 before:z-10 before:h-24 before:w-full before:to-transparent before:content-[''] md:h-auto md:before:h-0">
						{transcript ? transcript : 'Transcript Processing'}
					</ReactMarkdown>
				</div>
			)}
		</>
	)
}
