'use client'

import * as React from 'react'
import { onArticleSave } from '@/app/(content)/articles/[slug]/edit/actions'
import { ImageResourceUploader } from '@/components/image-uploader/image-resource-uploader'
import { env } from '@/env.mjs'
import { sendResourceChatMessage } from '@/lib/ai-chat-query'
import { ArticleSchema, type Article } from '@/lib/articles'
import { updateArticle } from '@/lib/articles-query'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import { zodResolver } from '@hookform/resolvers/zod'
import { ImagePlusIcon } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import type { ContentResource } from '@coursebuilder/core/schemas'
import { EditResourcesForm } from '@coursebuilder/ui/resources-crud/edit-resources-form'
import { EditResourcesMetadataFields } from '@coursebuilder/ui/resources-crud/edit-resources-metadata-fields'

type EditArticleFormProps = {
	article: Article
}

export function EditArticleForm({ article }: EditArticleFormProps) {
	const { data: session } = useSession()
	const defaultSocialImage = getOGImageUrlForResource(article)
	const { theme } = useTheme()
	const form = useForm<z.infer<typeof ArticleSchema>>({
		resolver: zodResolver(ArticleSchema),
		defaultValues: {
			...article,
			fields: {
				...article.fields,
				title: article.fields.title || '',
				description: article.fields.description ?? '',
				socialImage: {
					type: 'imageUrl',
					url: defaultSocialImage,
				},
				slug: article.fields.slug ?? '',
			},
		},
	})

	const ResourceForm = EditResourcesForm

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
			hostUrl={env.NEXT_PUBLIC_PARTY_KIT_URL}
			user={session?.user}
			tools={[
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
							uploadDirectory={`articles`}
						/>
					),
				},
			]}
			theme={theme}
		>
			<ArticleMetadataFormFields form={form} article={article} />
		</ResourceForm>
	)
}

const ArticleMetadataFormFields = ({
	form,
	article,
}: {
	form: UseFormReturn<z.infer<typeof ArticleSchema>>
	article: ContentResource & { fields?: { slug: string } }
}) => {
	return (
		<EditResourcesMetadataFields form={form}>
			{/*<MetadataFieldSocialImage*/}
			{/*	form={form}*/}
			{/*	currentSocialImage={getOGImageUrlForResource(article)}*/}
			{/*/>*/}
		</EditResourcesMetadataFields>
	)
}
