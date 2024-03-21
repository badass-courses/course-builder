import * as React from 'react'
import { Suspense, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { EditTipFormProps } from '@/app/tips/_components/edit-tip-form'
import { TipMetadataFormFields } from '@/app/tips/_components/edit-tip-form-metadata'
import { TipPlayer } from '@/app/tips/_components/tip-player'
import { reprocessTranscript } from '@/app/tips/[slug]/edit/actions'
import { CodemirrorEditor } from '@/components/codemirror'
import { useSocket } from '@/hooks/use-socket'
import { TipUpdate } from '@/lib/tips'
import { updateTip } from '@/lib/tips-query'
import { RefreshCcw } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

import {
	Button,
	Form,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@coursebuilder/ui'

export const MobileEditTipForm: React.FC<EditTipFormProps> = ({
	tip,
	form,
	videoResourceLoader,
}) => {
	const videoResource = use(videoResourceLoader)
	const [updateTipStatus, setUpdateTipStatus] = React.useState<
		'idle' | 'loading' | 'success' | 'error'
	>('idle')
	const [transcript, setTranscript] = React.useState<string | null>(
		videoResource?.transcript || null,
	)
	const [videoResourceId, setVideoResourceId] = React.useState<
		string | null | undefined
	>(tip.videoResourceId)
	const router = useRouter()

	useSocket({
		room: videoResourceId,
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

	const onSubmit = async (values: TipUpdate) => {
		const updatedTip = await updateTip({ ...values, _id: tip._id })
		setUpdateTipStatus('success')

		if (!updatedTip) {
			// handle edge case, e.g. toast an error message
		} else {
			const { slug } = updatedTip

			router.push(`/tips/${slug}`)
		}
	}

	const formValues = form.getValues()

	return (
		<>
			<div className="md:bg-muted bg-muted/60 sticky top-0 z-10 flex h-9 w-full items-center justify-between px-1 backdrop-blur-md md:backdrop-blur-none">
				<div className="flex items-center gap-2">
					<Button className="px-0" asChild variant="link">
						<Link href={`/tips/${tip.slug}`} className="aspect-square">
							←
						</Link>
					</Button>
					<span className="font-medium">
						Tip{' '}
						<span className="hidden font-mono text-xs font-normal md:inline-block">
							({tip._id})
						</span>
					</span>
				</div>
				<Button
					onClick={(e) => {
						setUpdateTipStatus('loading')
						onSubmit(form.getValues())
					}}
					type="button"
					size="sm"
					className="disabled:cursor-wait"
					disabled={updateTipStatus === 'loading'}
				>
					Save
				</Button>
			</div>
			<div className="flex flex-col">
				<Form {...form}>
					<form
						className="w-full"
						onSubmit={form.handleSubmit(onSubmit, (error) => {
							console.log({ error })
						})}
					>
						<div className="flex flex-col gap-8">
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
									<div className="px-5 text-xs">
										video is {videoResource?.state}
									</div>
								</Suspense>
							</div>
							<TipMetadataFormFields
								form={form}
								videoResourceLoader={videoResourceLoader}
								tip={tip}
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
						</div>
					</form>
				</Form>
				<div className="pt-5">
					<label className="px-5 text-lg font-bold">Content</label>
					<CodemirrorEditor
						roomName={`${tip._id}`}
						value={tip.body || ''}
						onChange={(data) => {
							form.setValue('body', data)
						}}
					/>
				</div>
			</div>
		</>
	)
}
