'use client'

import * as React from 'react'
import { Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { onArticleSave } from '@/app/(content)/posts/[slug]/edit/actions'
import { ImageResourceUploader } from '@/components/image-uploader/image-resource-uploader'
import { LessonPlayer } from '@/components/resources-crud/lesson-player'
import { NewLessonVideoForm } from '@/components/resources-crud/new-lesson-video-form'
import { env } from '@/env.mjs'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { useTranscript } from '@/hooks/use-transcript'
import { sendResourceChatMessage } from '@/lib/ai-chat-query'
import { ArticleSchema, type Article } from '@/lib/articles'
import { updateArticle } from '@/lib/articles-query'
import { api } from '@/trpc/react'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import { pollVideoResource } from '@/utils/poll-video-resource'
import { zodResolver } from '@hookform/resolvers/zod'
import { ImagePlusIcon, ListOrderedIcon, RefreshCcw } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { useForm, type UseFormReturn } from 'react-hook-form'
import ReactMarkdown from 'react-markdown'
import { z } from 'zod'

import type { VideoResource } from '@coursebuilder/core/schemas'
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@coursebuilder/ui'
import { useSocket } from '@coursebuilder/ui/hooks/use-socket'
import { EditResourcesFormDesktop } from '@coursebuilder/ui/resources-crud/edit-resources-form-desktop'
import { EditResourcesFormMobile } from '@coursebuilder/ui/resources-crud/edit-resources-form-mobile'
import { EditResourcesMetadataFields } from '@coursebuilder/ui/resources-crud/edit-resources-metadata-fields'
import { ResourceTool } from '@coursebuilder/ui/resources-crud/edit-resources-tool-panel'
import { MetadataFieldSocialImage } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-social-image'

import { PostPlayer } from '../../_components/post-player'
import { removeResourceFromResource, reprocessTranscript } from '../../actions'

// import { NewLessonVideoForm } from '../../tutorials/[module]/[lesson]/edit/_components/new-lesson-video-form'

type EditArticleFormProps = {
	article: Article
	tools?: ResourceTool[]
	videoResourceLoader: Promise<VideoResource | null>
	initialVideoResourceId: string | null | undefined
}

export function EditArticleForm({
	article,
	videoResourceLoader,
	initialVideoResourceId,
	tools = [
		{ id: 'assistant' },
		{
			id: 'media',
			icon: () => (
				<ImagePlusIcon strokeWidth={1.5} size={24} width={18} height={18} />
			),
			toolComponent: (
				<ImageResourceUploader
					key={'image-uploader'}
					belongsToResourceId={article.id}
					uploadDirectory={`workshops`}
				/>
			),
		},
	],
}: EditArticleFormProps) {
	const router = useRouter()
	const session = useSession()
	const defaultSocialImage = getOGImageUrlForResource(article)
	const { forcedTheme: theme } = useTheme()
	const form = useForm<z.infer<typeof ArticleSchema>>({
		resolver: zodResolver(ArticleSchema),
		defaultValues: {
			...article,
			fields: {
				...article.fields,
				description: article.fields?.description ?? '',
				socialImage: {
					type: 'imageUrl',
					url: defaultSocialImage,
				},
				slug: article.fields?.slug ?? '',
			},
		},
	})

	const isMobile = useIsMobile()

	const ResourceForm = isMobile
		? EditResourcesFormMobile
		: EditResourcesFormDesktop

	// const videoResource = React.use(videoResourceLoader)
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
		<ResourceForm
			resource={article}
			form={form}
			resourceSchema={ArticleSchema}
			getResourcePath={(slug) => `/${slug}`}
			updateResource={updateArticle}
			availableWorkflows={[
				{
					value: 'article-chat-default-5aj1o',
					label: 'Article Chat',
					default: true,
				},
			]}
			sendResourceChatMessage={sendResourceChatMessage}
			hostUrl={env.NEXT_PUBLIC_PARTY_KIT_URL}
			user={session?.data?.user}
			onSave={onArticleSave}
			tools={tools}
			theme={theme}
		>
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
								parentResourceId={article.id}
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
									<LessonPlayer videoResource={videoResource} />
									<Button
										variant="ghost"
										type="button"
										onClick={() => setReplacingVideo(true)}
									>
										Replace Video
									</Button>
									<Button
										variant="ghost"
										type="button"
										onClick={async () => {
											await removeResourceFromResource(
												videoResourceId,
												article.id,
											)
											setVideoResourceId(null)
										}}
									>
										Remove Video
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
						parentResourceId={article.id}
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
			<ArticleMetadataFormFields form={form} />
			{videoResourceId ? (
				<div className="px-5">
					<div className="flex items-center justify-between gap-2">
						<label className="text-lg font-bold">Transcript</label>
						{Boolean(videoResourceId) && transcript && (
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
		</ResourceForm>
	)
}

const ArticleMetadataFormFields = ({
	form,
}: {
	form: UseFormReturn<z.infer<typeof ArticleSchema>>
}) => {
	return (
		<EditResourcesMetadataFields form={form}>
			<MetadataFieldSocialImage
				form={form}
				currentSocialImage={getOGImageUrlForResource(form.getValues())}
			/>
		</EditResourcesMetadataFields>
	)
}
