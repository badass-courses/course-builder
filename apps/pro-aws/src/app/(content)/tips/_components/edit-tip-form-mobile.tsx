import * as React from 'react'
import { use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { EditTipFormProps } from '@/app/(content)/tips/_components/edit-tip-form'
import { TipMetadataFormFields } from '@/app/(content)/tips/_components/edit-tip-form-metadata'
import { env } from '@/env.mjs'
import { sendResourceChatMessage } from '@/lib/ai-chat-query'
import { TipUpdate } from '@/lib/tips'
import { updateTip } from '@/lib/tips-query'
import { useSession } from 'next-auth/react'

import { Button, Form } from '@coursebuilder/ui'
import { ResourceChatAssistant } from '@coursebuilder/ui/chat-assistant/resource-chat-assistant'
import { CodemirrorEditor } from '@coursebuilder/ui/codemirror/editor'
import { useSocket } from '@coursebuilder/ui/hooks/use-socket'

export const MobileEditTipForm: React.FC<EditTipFormProps> = ({
	tip,
	form,
	videoResourceLoader,
	availableWorkflows,
	theme = 'light',
}) => {
	const session = useSession()
	const videoResource = use(videoResourceLoader)
	const [updateTipStatus, setUpdateTipStatus] = React.useState<
		'idle' | 'loading' | 'success' | 'error'
	>('idle')
	const [transcript, setTranscript] = React.useState<string | null>(
		videoResource?.transcript || null,
	)
	const [videoResourceId, setVideoResourceId] = React.useState<
		string | null | undefined
	>(tip.resources?.[0]?.resource.id)
	const router = useRouter()

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

	const onSubmit = async (values: TipUpdate) => {
		const updatedTip = await updateTip({ ...values, id: tip.id })
		setUpdateTipStatus('success')

		if (!updatedTip) {
			// handle edge case, e.g. toast an error message
		} else {
			const { fields: slug } = updatedTip

			router.push(`/tips/${slug}`)
		}
	}

	const formValues = form.getValues()

	return (
		<>
			<div className="md:bg-muted bg-muted/60 sticky top-0 z-10 flex h-9 w-full items-center justify-between px-1 backdrop-blur-md md:backdrop-blur-none">
				<div className="flex items-center gap-2">
					<Button className="px-0" asChild variant="link">
						<Link href={`/tips/${tip?.fields.slug}`} className="aspect-square">
							←
						</Link>
					</Button>
					<span className="font-medium">
						Tip{' '}
						<span className="hidden font-mono text-xs font-normal md:inline-block">
							({tip.id})
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
							<TipMetadataFormFields
								form={form}
								videoResourceLoader={videoResourceLoader}
								tip={tip}
							/>
						</div>
					</form>
				</Form>
				<div className="pt-5">
					<label className="px-5 text-lg font-bold">Content</label>
					<CodemirrorEditor
						partykitUrl={env.NEXT_PUBLIC_PARTY_KIT_URL}
						roomName={`${tip.id}`}
						value={tip.fields.body || ''}
						onChange={(data) => {
							form.setValue('fields.body', data)
						}}
					/>
				</div>
				<div className="pt-5">
					<ResourceChatAssistant
						resource={tip}
						availableWorkflows={availableWorkflows}
						user={session?.data?.user}
						hostUrl={env.NEXT_PUBLIC_PARTY_KIT_URL}
						sendResourceChatMessage={sendResourceChatMessage}
					/>
				</div>
			</div>
		</>
	)
}
