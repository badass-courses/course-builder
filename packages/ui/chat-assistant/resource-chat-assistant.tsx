import * as React from 'react'
import { useRef } from 'react'
import { User } from '@auth/core/types'
import {
	ChatCompletionRequestMessage,
	ChatCompletionRequestMessageRoleEnum,
} from 'openai-edge'
import { z } from 'zod'

import type { ContentResource } from '@coursebuilder/core/schemas'

import { useSocket } from '../hooks/use-socket'
import { Button } from '../primitives/button'
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from '../primitives/resizable'
import { Textarea } from '../primitives/textarea'
import { AssistantWorkflowSelector } from './assistant-workflow-selector'
import {
	ResourceChatResponse,
	useChatAssistant,
} from './resource-chat-response'

export function ResourceChatAssistant({
	resource,
	availableWorkflows = [{ value: 'basic', label: 'Basic', default: true }],
	user,
	hostUrl,
	sendResourceChatMessage,
}: {
	resource: ContentResource
	sendResourceChatMessage: (options: {
		resourceId: string
		messages: any[]
		selectedWorkflow?: string
	}) => Promise<void>
	hostUrl: string
	user?: User | null
	availableWorkflows?: { value: string; label: string; default?: boolean }[]
}) {
	const [messages, setMessages] = React.useState<
		ChatCompletionRequestMessage[]
	>([])
	const [selectedWorkflow, setSelectedWorkflow] = React.useState<string>(
		availableWorkflows.find((w) => w.default)?.value ||
			availableWorkflows[0]?.value ||
			'basic',
	)
	const {
		messages: messagesToDisplay,
		setMessages: setMessagesToDisplay,
		setIsWaitingForResponse,
	} = useChatAssistant()

	const handleSendMessage = (
		event:
			| React.KeyboardEvent<HTMLTextAreaElement>
			| React.MouseEvent<HTMLButtonElement, MouseEvent>,
		messages: ChatCompletionRequestMessage[],
		selectedWorkflow?: string,
	) => {
		setIsWaitingForResponse(true)
		setMessagesToDisplay([
			...messagesToDisplay,
			{
				body: event.currentTarget.value,
				userId: user?.id,
			},
		])
		sendResourceChatMessage({
			resourceId: resource.id,
			messages: [
				...messages,
				{
					role: ChatCompletionRequestMessageRoleEnum.System,
					content: `## current state of content
          current title: ${resource.fields?.title}
          current body: ${resource.fields?.body}
          `,
				},
				{
					role: ChatCompletionRequestMessageRoleEnum.User,
					content: event.currentTarget.value,
				},
			],
			selectedWorkflow,
		})
	}

	useSocket({
		room: resource.id,
		host: hostUrl,
		onMessage: (messageEvent) => {
			try {
				const messageData = JSON.parse(messageEvent.data)

				if (
					messageData.name === 'resource.chat.completed' &&
					messageData.requestId === resource.id
				) {
					setIsWaitingForResponse(false)
					setMessages(messageData.body)
				}
			} catch (error) {
				setIsWaitingForResponse(false)
				// noting to do
			}
		},
	})
	const textareaRef = useRef<HTMLTextAreaElement>(null)

	return (
		<div className="flex h-full w-full flex-col justify-start">
			<div className="flex items-center justify-between gap-10 border-b p-5">
				<h3 className="inline-flex text-lg font-bold">Assistant</h3>
				{availableWorkflows.length > 1 ? (
					<AssistantWorkflowSelector
						initialValue={selectedWorkflow}
						onValueChange={(value) => {
							setSelectedWorkflow(value || selectedWorkflow)
						}}
						availableWorkflows={availableWorkflows}
					/>
				) : null}
			</div>
			<ResizablePanelGroup direction="vertical" id="resource-chat-panel-group">
				<ResizablePanel defaultSize={85} className="none">
					<ResourceChatResponse
						requestId={resource.id}
						hostUrl={hostUrl}
						user={user}
					/>
				</ResizablePanel>
				<ResizableHandle />
				<ResizablePanel
					defaultSize={15}
					minSize={5}
					className="relative flex w-full flex-col items-start"
				>
					<Textarea
						ref={textareaRef}
						className="w-full grow rounded-none border-0 px-5 py-4 pr-10 focus-visible:ring-0"
						placeholder="Tell the Assistant what you want..."
						onKeyDown={async (event) => {
							if (event.key === 'Enter' && !event.shiftKey) {
								event.preventDefault()
								const value = z
									.string()
									.min(1)
									.safeParse(event.currentTarget.value)
								if (value.success) {
									handleSendMessage(event, messages, selectedWorkflow)
									event.currentTarget.value = ''
								}
							}
						}}
					/>
					<Button
						type="button"
						className="absolute right-2 top-4 flex h-6 w-6 items-center justify-center p-0"
						variant="outline"
						onClick={async (event) => {
							event.preventDefault()
							if (textareaRef.current) {
								const value = z
									.string()
									.min(1)
									.safeParse(textareaRef.current.value)
								if (value.success) {
									handleSendMessage(event, messages, selectedWorkflow)
									textareaRef.current.value = ''
								}
							}
						}}
					>
						<div className="w-4">↑</div>
					</Button>
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	)
}
