'use client'

import * as React from 'react'
import { TipMetadataFormFields } from '@/app/tips/_components/edit-tip-form-metadata'
import { MobileEditTipForm } from '@/app/tips/_components/edit-tip-form-mobile'
import { EditResourcesFormDesktop } from '@/components/resources-crud/edit-resources-form-desktop'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { TipSchema, type Tip } from '@/lib/tips'
import { updateTip } from '@/lib/tips-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import { VideoResource } from '@coursebuilder/core/schemas/video-resource'
import { ContentResource } from '@coursebuilder/core/types'

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
	onSave: (resource: ContentResource) => Promise<void>
}

export function EditTipForm({
	tip,
	videoResourceLoader,
	onSave,
}: Omit<EditTipFormProps, 'form'>) {
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
			onSave={onSave}
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
			onSave={onSave}
		>
			<TipMetadataFormFields
				form={form}
				videoResourceLoader={videoResourceLoader}
				tip={tip}
			/>
		</EditResourcesFormDesktop>
	)
}
