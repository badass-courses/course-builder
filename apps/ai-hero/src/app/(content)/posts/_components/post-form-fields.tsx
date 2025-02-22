import * as React from 'react'
import { ResourceFormProps } from '@/components/resource-form/with-resource-form'
import { sendResourceChatMessage } from '@/lib/ai-chat-query'
import { Post, PostSchema } from '@/lib/posts'

import { MetadataFormFieldsSwitcher } from './metadata-form-fields-switcher'

/**
 * Post form fields component for editing post metadata
 */
export function PostFormFields({
	form,
	resource,
	videoResourceId,
	listsLoader,
}: ResourceFormProps<Post, typeof PostSchema> & {
	videoResourceId?: string | null
	listsLoader: Promise<any[]>
}) {
	if (!form) return null

	return (
		<MetadataFormFieldsSwitcher
			form={form}
			post={resource}
			videoResourceId={videoResourceId}
			listsLoader={listsLoader}
			sendResourceChatMessage={sendResourceChatMessage}
		/>
	)
}
