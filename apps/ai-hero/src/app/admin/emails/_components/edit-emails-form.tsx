'use client'

import * as React from 'react'
import { onEmailSave } from '@/app/admin/emails/[slug]/edit/actions'
import { ImageResourceUploader } from '@/components/image-uploader/image-resource-uploader'
import { env } from '@/env.mjs'
import { sendResourceChatMessage } from '@/lib/ai-chat-query'
import { Email, EmailSchema } from '@/lib/emails'
import { updateEmail } from '@/lib/emails-query'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import { zodResolver } from '@hookform/resolvers/zod'
import { ImagePlusIcon } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import { EditResourcesForm } from '@coursebuilder/ui/resources-crud/edit-resources-form'
import { EditResourcesMetadataFields } from '@coursebuilder/ui/resources-crud/edit-resources-metadata-fields'
import { ResourceTool } from '@coursebuilder/ui/resources-crud/edit-resources-tool-panel'

type EditArticleFormProps = {
	email: Email
	tools?: ResourceTool[]
}

export function EditEmailsForm({
	email,
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
					belongsToResourceId={email.id}
					uploadDirectory={`workshops`}
				/>
			),
		},
	],
}: EditArticleFormProps) {
	const session = useSession()
	const defaultSocialImage = getOGImageUrlForResource(email)
	const { resolvedTheme } = useTheme()
	const form = useForm<z.infer<typeof EmailSchema>>({
		resolver: zodResolver(EmailSchema),
		defaultValues: {
			...email,
			fields: {
				...email.fields,
				description: email.fields?.description ?? '',
				socialImage: {
					type: 'imageUrl',
					url: defaultSocialImage,
				},
				slug: email.fields?.slug ?? '',
			},
		},
	})

	const ResourceForm = EditResourcesForm

	return (
		<ResourceForm
			resource={email}
			form={form}
			resourceSchema={EmailSchema}
			getResourcePath={(slug) => `/${slug}`}
			updateResource={updateEmail}
			availableWorkflows={[
				{
					value: 'article-chat-default-5aj1o',
					label: 'Email Chat',
					default: true,
				},
			]}
			sendResourceChatMessage={sendResourceChatMessage}
			hostUrl={env.NEXT_PUBLIC_PARTY_KIT_URL}
			user={session?.data?.user}
			onSave={onEmailSave}
			tools={tools}
			theme={resolvedTheme}
		>
			<EmailMetadataFormFields form={form} />
		</ResourceForm>
	)
}

const EmailMetadataFormFields = ({
	form,
}: {
	form: UseFormReturn<z.infer<typeof EmailSchema>>
}) => {
	return <EditResourcesMetadataFields form={form}></EditResourcesMetadataFields>
}
