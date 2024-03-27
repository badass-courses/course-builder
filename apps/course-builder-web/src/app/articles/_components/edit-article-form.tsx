'use client'

import * as React from 'react'
import { EditResourcesFormDesktop } from '@/components/resources-crud/edit-resources-form-desktop'
import { EditResourcesFormMobile } from '@/components/resources-crud/edit-resources-form-mobile'
import { EditResourcesMetadataFields } from '@/components/resources-crud/edit-resources-metadata-fields'
import { MetadataFieldSocialImage } from '@/components/resources-crud/metadata-fields/metadata-field-social-image'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { ArticleSchema, type Article } from '@/lib/articles'
import { updateArticle } from '@/lib/articles-query'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

type EditArticleFormProps = {
	article: Article
}

export function EditArticleForm({ article }: EditArticleFormProps) {
	const defaultSocialImage = getOGImageUrlForResource(article)
	const form = useForm<z.infer<typeof ArticleSchema>>({
		resolver: zodResolver(ArticleSchema),
		defaultValues: {
			...article,
			fields: {
				description: article.fields?.description ?? '',
				socialImage: defaultSocialImage,
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
			getResourcePath={(slug) => `/${slug}`}
			updateResource={updateArticle}
			availableWorkflows={[
				{
					value: 'article-chat-default-5aj1o',
					label: 'Article Chat',
					default: true,
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
	const currentSocialImage = form.watch('fields.socialImage')
	return (
		<EditResourcesMetadataFields form={form}>
			<MetadataFieldSocialImage
				form={form}
				currentSocialImage={currentSocialImage}
			/>
		</EditResourcesMetadataFields>
	)
}
