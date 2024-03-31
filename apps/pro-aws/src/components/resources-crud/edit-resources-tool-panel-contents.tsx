import * as React from 'react'
import { ResourceChatAssistant } from '@/components/chat-assistant/resource-chat-assistant'
import { ImageResourceUploader } from '@/components/image-uploader/image-resource-uploader'

import { ContentResource } from '@coursebuilder/core/types'

export function EditResourcesToolPanelContents({
	resource,
	activeToolId,
	availableWorkflows,
}: {
	resource: ContentResource & {
		fields: {
			body?: string | null
			title?: string | null
			slug: string
		}
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
