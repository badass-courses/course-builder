import * as React from 'react'
import { Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { LessonPlayer } from '@/app/(content)/_components/lesson-player'
import { NewLessonVideoForm } from '@/app/(content)/_components/new-lesson-video-form'
import { env } from '@/env.mjs'
import { useTranscript } from '@/hooks/use-transcript'
import { Lesson, type LessonSchema } from '@/lib/lessons'
import { api } from '@/trpc/react'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import { pollVideoResource } from '@/utils/poll-video-resource'
import { PlusCircle, RefreshCcw, Trash } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'
import ReactMarkdown from 'react-markdown'
import { z } from 'zod'

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
import { MetadataFieldSocialImage } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-social-image'
import { MetadataFieldState } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-state'
import { MetadataFieldVisibility } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-visibility'

import { reprocessTranscript } from '../../posts/[slug]/edit/actions'

export const LessonMetadataFormFields: React.FC<{
	form: UseFormReturn<z.infer<typeof LessonSchema>>
	initialVideoResourceId: string | null | undefined
	lesson: Lesson
}> = ({ form, initialVideoResourceId, lesson }) => {
	const router = useRouter()
	const { module } = useParams<{
		module: string
		lesson: string
	}>()
	const [videoUploadStatus, setVideoUploadStatus] = React.useState<
		'loading' | 'finalizing upload'
	>('loading')

	const [replacingVideo, setReplacingVideo] = React.useState(false)

	const [videoResourceId, setVideoResourceId] = React.useState<
		string | null | undefined
	>(initialVideoResourceId)

	const { data: videoResource, refetch } = api.videoResources.get.useQuery({
		videoResourceId: videoResourceId,
	})

	const { transcript, setTranscript } = useTranscript({
		videoResourceId,
		initialTranscript: videoResource?.transcript,
	})

	// Fetch solution for this lesson if it exists
	const {
		data: solutionResource,
		isLoading: solutionLoading,
		refetch: refetchSolution,
	} = api.solutions.getForLesson.useQuery(
		{
			lessonId: lesson.id,
		},
		{
			enabled: !!lesson.id,
		},
	)

	// Solution mutations
	const createSolutionMutation = api.solutions.create.useMutation({
		onSuccess: () => {
			refetchSolution()
		},
	})

	const deleteSolutionMutation = api.solutions.delete.useMutation({
		onSuccess: () => {
			refetchSolution()
		},
	})

	React.useEffect(() => {
		async function run() {
			if (videoResourceId) {
				await pollVideoResource(videoResourceId).next()
				refetch()
			}
		}

		if (!['ready', 'errored'].includes(videoResource?.state || '')) {
			run()
		}
	}, [videoResource?.state, videoResourceId, refetch])

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

	return (
		<>
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
									parentResourceId={lesson.id}
									moduleSlugOrId={module}
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
										<LessonPlayer
											title={lesson.fields?.title}
											videoResource={videoResource}
										/>
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
							parentResourceId={lesson.id}
							moduleSlugOrId={module}
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
							A title should summarize the tip and explain what it is about
							clearly.
						</FormDescription>
						<Input {...field} />
						<FormMessage />
					</FormItem>
				)}
			/>

			{/* Solution Section */}
			<div className="mt-6 border-t px-5 pt-6">
				<div className="flex items-center justify-between gap-2">
					<label className="text-lg font-bold">Solution</label>
				</div>

				{solutionLoading ? (
					<div className="mt-4 animate-pulse space-y-4">
						<div className="flex items-center justify-between">
							<div className="bg-muted h-5 w-1/3 rounded"></div>
							<div className="flex space-x-2">
								<div className="bg-muted h-9 w-24 rounded"></div>
								<div className="bg-muted h-9 w-24 rounded"></div>
							</div>
						</div>
						<div className="bg-muted h-32 rounded-md p-4"></div>
						<div className="space-y-2">
							<div className="bg-muted-foreground/20 h-3 w-24 rounded"></div>
							<div className="bg-muted-foreground/20 h-4 w-full rounded"></div>
							<div className="bg-muted-foreground/20 h-4 w-3/4 rounded"></div>
						</div>
					</div>
				) : solutionResource ? (
					<div className="mt-4 space-y-4">
						<div className="flex items-center justify-between">
							<h3 className="font-medium">{solutionResource.fields.title}</h3>
							<div className="space-x-2">
								<Button
									variant="outline"
									onClick={() =>
										router.push(
											`/workshops/${module}/${lesson.fields.slug}/solution/edit`,
										)
									}
								>
									Edit Solution
								</Button>
								<Button
									variant="destructive"
									size="sm"
									onClick={() => {
										if (
											confirm('Are you sure you want to delete this solution?')
										) {
											deleteSolutionMutation.mutate({
												solutionId: solutionResource.id,
											})
										}
									}}
								>
									<Trash className="mr-2 h-4 w-4" />
									Delete Solution
								</Button>
							</div>
						</div>
						<div className="bg-muted rounded-md p-4">
							<ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">
								{solutionResource.fields.body || 'No solution content yet.'}
							</ReactMarkdown>
						</div>
						{solutionResource.fields.description && (
							<div className="prose prose-sm dark:prose-invert text-muted-foreground max-w-none">
								<p className="text-xs font-medium uppercase">Explanation:</p>
								<ReactMarkdown>
									{solutionResource.fields.description}
								</ReactMarkdown>
							</div>
						)}
					</div>
				) : (
					<div className="mt-4">
						<Button
							onClick={() =>
								router.push(
									`/workshops/${module}/${lesson.fields.slug}/solution/edit`,
								)
							}
						>
							<PlusCircle className="mr-2 h-4 w-4" />
							Add Solution
						</Button>
					</div>
				)}
			</div>
			<FormField
				control={form.control}
				name="fields.description"
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel className="text-lg font-bold">Description</FormLabel>
						<FormDescription>
							A short snippet that summarizes the lesson.
						</FormDescription>
						<Textarea {...field} />
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
							Direct link to the GitHub file associated with the lesson.
						</FormDescription>
						<Input {...field} />
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
							Gitpod link to start a new workspace with the lesson.
						</FormDescription>
						<Input {...field} />
						<FormMessage />
					</FormItem>
				)}
			/>
			<MetadataFieldSocialImage
				form={form}
				currentSocialImage={getOGImageUrlForResource(form.getValues())}
			/>
			{videoResourceId ? (
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
			) : null}
		</>
	)
}
