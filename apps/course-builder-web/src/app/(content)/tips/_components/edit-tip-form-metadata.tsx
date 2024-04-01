import * as React from 'react'
import { Suspense, use } from 'react'
import { useRouter } from 'next/navigation'
import { TipPlayer } from '@/app/(content)/tips/_components/tip-player'
import { reprocessTranscript } from '@/app/(content)/tips/[slug]/edit/actions'
import { env } from '@/env.mjs'
import { useTranscript } from '@/hooks/use-transcript'
import { TipSchema, type Tip } from '@/lib/tips'
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
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@coursebuilder/ui'
import { useSocket } from '@coursebuilder/ui/hooks/use-socket'

export const TipMetadataFormFields: React.FC<{
	form: UseFormReturn<z.infer<typeof TipSchema>>
	videoResourceLoader: Promise<VideoResource | null>
	tip: Tip
}> = ({ form, videoResourceLoader, tip }) => {
	const router = useRouter()
	const videoResource = videoResourceLoader ? use(videoResourceLoader) : null

	const [videoResourceId, setVideoResourceId] = React.useState<
		string | null | undefined
	>(tip.resources?.[0]?.resource.id)
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
				<Suspense
					fallback={
						<>
							<div className="bg-muted flex aspect-video h-full w-full items-center justify-center p-5">
								video is loading
							</div>
						</>
					}
				>
					<TipPlayer videoResourceLoader={videoResourceLoader} />
					<div className="px-5 text-xs">video is {videoResource?.state}</div>
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
								<TooltipContent side="top">Reprocess Transcript</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)}
				</div>
				<ReactMarkdown className="prose prose-sm dark:prose-invert before:from-background relative mt-3 h-48 max-w-none overflow-hidden before:absolute before:bottom-0 before:left-0 before:z-10 before:h-24 before:w-full before:bg-gradient-to-t before:to-transparent before:content-[''] md:h-auto md:before:h-0">
					{transcript ? transcript : 'Transcript Processing'}
				</ReactMarkdown>
			</div>
		</>
	)
}
