import * as React from 'react'
import { ResourceChatAssistant } from '@/components/chat-assistant/resource-chat-assistant'
import { ImageResourceUploader } from '@/components/image-uploader/image-resource-uploader'

export function EditResourcesToolPanelContents({
	resource,
	activeToolId,
	availableWorkflows,
}: {
	resource: {
		type: string
		id: string
		body?: string | null
		title?: string | null
	}
	activeToolId: string
	availableWorkflows?: { value: string; label: string; default?: boolean }[]
}) {
	return (
		<>
			{activeToolId === 'assistant' && (
				<ResourceChatAssistant
					resource={resource}
					availableWorkflows={availableWorkflows}
				/>
			)}
			{activeToolId === 'media' && (
				<ImageResourceUploader
					belongsToResourceId={resource.id}
					uploadDirectory={`${resource.type}s`}
				/>
			)}
		</>
	)
}
