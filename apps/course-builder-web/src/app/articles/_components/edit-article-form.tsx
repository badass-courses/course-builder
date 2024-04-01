'use client'

import * as React from 'react'
import { onArticleSave } from '@/app/articles/[slug]/edit/actions'
import { ImageResourceUploader } from '@/components/image-uploader/image-resource-uploader'
import { env } from '@/env.mjs'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { sendResourceChatMessage } from '@/lib/ai-chat-query'
import { ArticleSchema, type Article } from '@/lib/articles'
import { updateArticle } from '@/lib/articles-query'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import { zodResolver } from '@hookform/resolvers/zod'
import { ImagePlusIcon } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import { EditResourcesFormDesktop } from '@coursebuilder/ui/resources-crud/edit-resources-form-desktop'
import { EditResourcesFormMobile } from '@coursebuilder/ui/resources-crud/edit-resources-form-mobile'
import { EditResourcesMetadataFields } from '@coursebuilder/ui/resources-crud/edit-resources-metadata-fields'
import { ResourceTool } from '@coursebuilder/ui/resources-crud/edit-resources-tool-panel'
import { MetadataFieldSocialImage } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-social-image'

type EditArticleFormProps = {
	article: Article
	tools?: ResourceTool[]
}

export function EditArticleForm({ article, tools }: EditArticleFormProps) {
	const { data: session } = useSession()
	const defaultSocialImage = getOGImageUrlForResource(article)
	const form = useForm<z.infer<typeof ArticleSchema>>({
		resolver: zodResolver(ArticleSchema),
		defaultValues: {
			...article,
			fields: {
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

	return (
		<ResourceForm
			resource={article}
			form={form}
			resourceSchema={ArticleSchema}
			getResourcePath={(slug?: string) => `/${slug}`}
			updateResource={updateArticle}
			onSave={onArticleSave}
			availableWorkflows={[
				{
					value: 'article-chat-default-5aj1o',
					label: 'Article Chat',
					default: true,
				},
			]}
			sendResourceChatMessage={sendResourceChatMessage}
			hostUrl={env.NEXT_PUBLIC_PARTYKIT_ROOM_NAME}
			user={session?.user}
			tools={[
				{
					id: 'media',
					icon: () => (
						<ImagePlusIcon strokeWidth={1.5} size={24} width={18} height={18} />
					),
					toolComponent: (
						<ImageResourceUploader
							belongsToResourceId={article.id}
							uploadDirectory={`articles`}
						/>
					),
				},
			]}
		>
			<ArticleMetadataFormFields form={form} />
		</ResourceForm>
	)
}

const ArticleMetadataFormFields = ({
	form,
}: {
	form: UseFormReturn<z.infer<typeof ArticleSchema>>
}) => {
	const currentSocialImage = form.watch('fields.socialImage.url')
	return (
		<EditResourcesMetadataFields form={form}>
			<MetadataFieldSocialImage
				form={form}
				currentSocialImage={currentSocialImage}
			/>
		</EditResourcesMetadataFields>
	)
}
