import * as React from 'react'

import { ContentResource } from '@coursebuilder/core/types'

import { ResourceChatAssistant } from '../chat-assistant/resource-chat-assistant'

export function EditResourcesToolPanelContents({
	resource,
	activeToolId,
	availableWorkflows,
	children,
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
	children?: React.ReactNode
}) {
	return (
		<>
			{activeToolId === 'assistant' && (
				<ResourceChatAssistant
					resource={resource}
					availableWorkflows={availableWorkflows}
				/>
			)}
			{children}
		</>
	)
}
