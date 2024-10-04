'use client'

import * as React from 'react'
import { onPostSave } from '@/app/(content)/posts/[slug]/edit/actions'
import { ImageResourceUploader } from '@/components/image-uploader/image-resource-uploader'
import { env } from '@/env.mjs'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { sendResourceChatMessage } from '@/lib/ai-chat-query'
import { PostSchema, type Post } from '@/lib/posts'
import { updatePost } from '@/lib/posts-query'
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

type EditPostFormProps = {
	post: Post
	tools?: ResourceTool[]
}

export function EditPostForm({
	post,
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
					belongsToResourceId={post.id}
					uploadDirectory={`workshops`}
				/>
			),
		},
	],
}: EditPostFormProps) {
	const session = useSession()
	const defaultSocialImage = getOGImageUrlForResource(post)
	const { forcedTheme: theme } = useTheme()
	const form = useForm<z.infer<typeof PostSchema>>({
		resolver: zodResolver(PostSchema),
		defaultValues: {
			...post,
			fields: {
				...post.fields,
				description: post.fields?.description ?? '',
				socialImage: {
					type: 'imageUrl',
					url: defaultSocialImage,
				},
				slug: post.fields?.slug ?? '',
			},
		},
	})

	const isMobile = useIsMobile()

	const ResourceForm = isMobile
		? EditResourcesFormMobile
		: EditResourcesFormDesktop

	return (
		<ResourceForm
			resource={post}
			form={form}
			resourceSchema={PostSchema}
			getResourcePath={(slug) => `/${slug}`}
			updateResource={updatePost}
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
			onSave={onPostSave}
			tools={tools}
			theme={theme}
		>
			<ArticleMetadataFormFields form={form} />
		</ResourceForm>
	)
}

const ArticleMetadataFormFields = ({
	form,
}: {
	form: UseFormReturn<z.infer<typeof PostSchema>>
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
