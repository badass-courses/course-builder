'use client'

import * as React from 'react'
import { TipMetadataFormFields } from '@/app/tips/_components/edit-tip-form-metadata'
import { MobileEditTipForm } from '@/app/tips/_components/edit-tip-form-mobile'
import { onTipSave } from '@/app/tips/[slug]/edit/actions'
import { ImageResourceUploader } from '@/components/image-uploader/image-resource-uploader'
import { env } from '@/env.mjs'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { sendResourceChatMessage } from '@/lib/ai-chat-query'
import { TipSchema, type Tip } from '@/lib/tips'
import { updateTip } from '@/lib/tips-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { ImagePlusIcon } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import { VideoResource } from '@coursebuilder/core/schemas/video-resource'
import { EditResourcesFormDesktop } from '@coursebuilder/ui/resources-crud/edit-resources-form-desktop'

const NewTipFormSchema = z.object({
	title: z.string().min(2).max(90),
	body: z.string().optional().nullable(),
})

export type EditTipFormProps = {
	tip: Tip
	videoResourceLoader: Promise<VideoResource | null>
	form: UseFormReturn<z.infer<typeof TipSchema>>
	children?: React.ReactNode
	availableWorkflows?: { value: string; label: string; default?: boolean }[]
}

export function EditTipForm({
	tip,
	videoResourceLoader,
}: Omit<EditTipFormProps, 'form'>) {
	const session = useSession()
	const form = useForm<z.infer<typeof TipSchema>>({
		resolver: zodResolver(NewTipFormSchema),
		defaultValues: {
			id: tip.id,
			fields: {
				title: tip.fields?.title,
				body: tip.fields?.body,
			},
		},
	})
	const isMobile = useIsMobile()

	return isMobile ? (
		<MobileEditTipForm
			tip={tip}
			form={form}
			videoResourceLoader={videoResourceLoader}
			availableWorkflows={[
				{ value: 'tip-chat-default-okf8v', label: 'Tip Chat', default: true },
			]}
		/>
	) : (
		<EditResourcesFormDesktop
			resource={tip}
			resourceSchema={TipSchema}
			getResourcePath={(slug) => `/tips/${slug}`}
			updateResource={updateTip}
			form={form}
			availableWorkflows={[
				{ value: 'tip-chat-default-okf8v', label: 'Tip Chat', default: true },
			]}
			sendResourceChatMessage={sendResourceChatMessage}
			hostUrl={env.NEXT_PUBLIC_PARTY_KIT_URL}
			user={session?.data?.user}
			onSave={onTipSave}
			tools={[
				{
					id: 'media',
					icon: () => (
						<ImagePlusIcon strokeWidth={1.5} size={24} width={18} height={18} />
					),
					toolComponent: (
						<ImageResourceUploader
							belongsToResourceId={tip.id}
							uploadDirectory={`tips`}
						/>
					),
				},
			]}
		>
			<TipMetadataFormFields
				form={form}
				videoResourceLoader={videoResourceLoader}
				tip={tip}
			/>
		</EditResourcesFormDesktop>
	)
}
