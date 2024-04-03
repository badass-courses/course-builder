import * as React from 'react'
import { Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { reprocessTranscript } from '@/app/(content)/tips/[slug]/edit/actions'
import { LessonPlayer } from '@/app/(content)/tutorials/[module]/[lesson]/edit/_components/lesson-player'
import { NewLessonVideoForm } from '@/app/(content)/tutorials/[module]/[lesson]/edit/_components/new-lesson-video-form'
import { env } from '@/env.mjs'
import { useTranscript } from '@/hooks/use-transcript'
import { Lesson } from '@/lib/lessons'
import { TipSchema } from '@/lib/tips'
import { api } from '@/trpc/react'
import { pollVideoResource } from '@/utils/poll-video-resource'
import { RefreshCcw } from 'lucide-react'
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
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@coursebuilder/ui'
import { useSocket } from '@coursebuilder/ui/hooks/use-socket'
import { MetadataFieldState } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-state'
import { MetadataFieldVisibility } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-visibility'

export const LessonMetadataFormFields: React.FC<{
	form: UseFormReturn<z.infer<typeof TipSchema>>
	initialVideoResourceId: string | null | undefined
	lesson: Lesson
}> = ({ form, initialVideoResourceId, lesson }) => {
	const router = useRouter()
	const [videoUploadStatus, setVideoUploadStatus] = React.useState<
		'loading' | 'processing'
	>('loading')

	const [videoResourceId, setVideoResourceId] = React.useState<
		string | null | undefined
	>(initialVideoResourceId)

	const { data: videoResource, refetch } = api.videoResources.get.useQuery({
		videoResourceId: videoResourceId,
	})

	const [transcript, setTranscript] = useTranscript({
		videoResourceId,
		initialTranscript: videoResource?.transcript,
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
						<>
							{videoResource && videoResource.state === 'ready' ? (
								<LessonPlayer videoResource={videoResource} />
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
					) : (
						<NewLessonVideoForm
							lessonId={lesson.id}
							onVideoUploadCompleted={(videoResourceId) => {
								setVideoUploadStatus('processing')
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
			<MetadataFieldVisibility form={form} />
			<MetadataFieldState form={form} />
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
