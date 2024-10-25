import * as React from 'react'
import { User } from '@auth/core/types'

import type { ContentResource } from '@coursebuilder/core/schemas'

import { ResourceChatAssistant } from '../chat-assistant/resource-chat-assistant'
import { ChatProvider } from '../chat-assistant/resource-chat-response'
import { ResourceTool } from './edit-resources-tool-panel'

export function EditResourcesToolPanelContents({
	resource,
	activeToolId,
	availableWorkflows,
	children,
	sendResourceChatMessage,
	hostUrl,
	user,
	tools = [],
}: {
	resource: ContentResource & {
		fields: {
			body?: string | null
			title?: string | null
			slug: string
		}
	}
	activeToolId: string | null
	availableWorkflows?: { value: string; label: string; default?: boolean }[]
	children?: React.ReactNode
	sendResourceChatMessage: (options: {
		resourceId: string
		messages: any[]
		selectedWorkflow?: string
	}) => Promise<void>
	hostUrl: string
	user?: User | null
	tools?: ResourceTool[]
}) {
	return (
		<>
			{activeToolId === 'assistant' && (
				<ChatProvider>
					<ResourceChatAssistant
						key={'resource-chat-assistant'}
						resource={resource}
						availableWorkflows={availableWorkflows}
						sendResourceChatMessage={sendResourceChatMessage}
						hostUrl={hostUrl}
						user={user}
					/>
				</ChatProvider>
			)}
			{tools.map((tool) => (
				<div key={tool.id}>
					{activeToolId === tool.id && tool.toolComponent}
				</div>
			))}
			{children}
		</>
	)
}
