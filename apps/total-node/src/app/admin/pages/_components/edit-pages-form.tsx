'use client'

import * as React from 'react'
import { onPostSave } from '@/app/(content)/posts/[slug]/edit/actions'
import { onPageSave } from '@/app/admin/pages/[slug]/edit/actions'
import { ImageResourceUploader } from '@/components/image-uploader/image-resource-uploader'
import { env } from '@/env.mjs'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { sendResourceChatMessage } from '@/lib/ai-chat-query'
import { Page, PageSchema } from '@/lib/pages'
import { updatePage } from '@/lib/pages-query'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import { zodResolver } from '@hookform/resolvers/zod'
import { ImagePlusIcon, ListOrderedIcon } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import { EditResourcesFormDesktop } from '@coursebuilder/ui/resources-crud/edit-resources-form-desktop'
import { EditResourcesFormMobile } from '@coursebuilder/ui/resources-crud/edit-resources-form-mobile'
import { EditResourcesMetadataFields } from '@coursebuilder/ui/resources-crud/edit-resources-metadata-fields'
import { ResourceTool } from '@coursebuilder/ui/resources-crud/edit-resources-tool-panel'
import { MetadataFieldSocialImage } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-social-image'

type EditArticleFormProps = {
	page: Page
	tools?: ResourceTool[]
}

export function EditPagesForm({
	page,
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
					belongsToResourceId={page.id}
					uploadDirectory={`workshops`}
				/>
			),
		},
	],
}: EditArticleFormProps) {
	const session = useSession()
	const defaultSocialImage = getOGImageUrlForResource(page)
	const { forcedTheme: theme } = useTheme()
	const form = useForm<z.infer<typeof PageSchema>>({
		resolver: zodResolver(PageSchema),
		defaultValues: {
			...page,
			fields: {
				...page.fields,
				description: page.fields?.description ?? '',
				socialImage: {
					type: 'imageUrl',
					url: defaultSocialImage,
				},
				slug: page.fields?.slug ?? '',
			},
		},
	})

	const isMobile = useIsMobile()

	const ResourceForm = isMobile
		? EditResourcesFormMobile
		: EditResourcesFormDesktop

	return (
		<ResourceForm
			resource={page}
			form={form}
			resourceSchema={PageSchema}
			getResourcePath={(slug) => `/${slug}`}
			updateResource={updatePage}
			availableWorkflows={[
				{
					value: 'article-chat-default-5aj1o',
					label: 'Page Chat',
					default: true,
				},
			]}
			sendResourceChatMessage={sendResourceChatMessage}
			hostUrl={env.NEXT_PUBLIC_PARTY_KIT_URL}
			user={session?.data?.user}
			onSave={onPageSave}
			tools={tools}
			theme={theme}
		>
			<PageMetadataFormFields form={form} />
		</ResourceForm>
	)
}

const PageMetadataFormFields = ({
	form,
}: {
	form: UseFormReturn<z.infer<typeof PageSchema>>
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
