import * as React from 'react'
import { ResourceChatAssistant } from '@/components/chat-assistant/resource-chat-assistant'
import { ImageResourceUploader } from '@/components/image-uploader/image-resource-uploader'

export function EditResourcesToolPanelContents({
	resource,
	activeToolId,
}: {
	resource: {
		_type: string
		_id: string
		body?: string | null
		title?: string | null
	}
	activeToolId: string
}) {
	return (
		<>
			{activeToolId === 'assistant' && (
				<ResourceChatAssistant resource={resource} />
			)}
			{activeToolId === 'media' && (
				<ImageResourceUploader
					belongsToResourceId={resource._id}
					uploadDirectory={`${resource._type}s`}
				/>
			)}
		</>
	)
}
