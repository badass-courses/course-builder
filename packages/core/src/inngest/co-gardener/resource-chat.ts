import { NonRetriableError } from 'inngest'
import { Liquid } from 'liquidjs'
import {
	ChatCompletionRequestMessage,
	ChatCompletionRequestMessageRoleEnum,
} from 'openai-edge'
import { z } from 'zod'

import { CourseBuilderAdapter } from '../../adapters'
import { LlmProviderConfig } from '../../providers/openai'
import { PartyProviderConfig } from '../../providers/partykit'
import { User } from '../../schemas'
import {
	CoreInngestFunctionInput,
	CoreInngestHandler,
	CoreInngestTrigger,
} from '../create-inngest-middleware'
import { streamingChatPromptExecutor } from '../util/streaming-chat-prompt-executor'

export const ChatResourceSchema = z.object({
	id: z.string(),
	type: z.string(),
	updatedAt: z.string().nullable(),
	createdAt: z.string().nullable(),
	title: z.string().nullable().optional(),
	body: z.string().nullable().optional(),
	transcript: z.string().nullable().optional(),
	wordLevelSrt: z.string().nullable().optional(),
})

export type ChatResource = z.infer<typeof ChatResourceSchema>

export const RESOURCE_CHAT_REQUEST_EVENT = 'resource/chat-request-event'
export type ResourceChat = {
	name: typeof RESOURCE_CHAT_REQUEST_EVENT
	data: {
		resourceId: string
		messages: ChatCompletionRequestMessage[]
		promptId?: string
		selectedWorkflow: string
	}
	user: Record<string, any>
}

export const resourceChatConfig = {
	id: `resource-chat`,
	name: 'Resource Chat',
	rateLimit: {
		key: 'event.user.id',
		limit: 5,
		period: '1m' as `${number}m`,
	},
}

export const resourceChatTrigger: CoreInngestTrigger = {
	event: RESOURCE_CHAT_REQUEST_EVENT,
}

/**
 * TODO: Cancellation conditions need to be added $$
 */
export const resourceChat: CoreInngestHandler = async ({
	event,
	step,
	openaiProvider,
	partyProvider,
	db,
}: CoreInngestFunctionInput) => {
	const resourceId = event.data.resourceId
	const workflowTrigger = event.data.selectedWorkflow

	const resource = await step.run('get the resource', async () => {
		return db.getContentResource(resourceId)
	})

	if (!resource) {
		throw new NonRetriableError(`Resource not found for id (${resourceId})`)
	}

	const videoResource = await step.run('get the video resource', async () => {
		return db.getVideoResource(resource.resources?.[0]?.resource.id)
	})

	const messages = await resourceChatWorkflowExecutor({
		db,
		openaiProvider,
		partyProvider,
		step,
		workflowTrigger,
		resourceId,

		resource: {
			...videoResource,
			...resource,
			// @ts-expect-error
			...resource.fields,
			resources: JSON.stringify(resource.resources ?? []),
		},
		messages: event.data.messages,
		// @ts-expect-error
		user: event.user,
	})

	return { resource: { ...videoResource, ...resource }, messages }
}

/**
 * loads the workflow from sanity based on the trigger and then executes the workflow using the `resource` as
 * input that is parsed by liquid into the prompt
 *
 * This treats the system prompt as "special" from the loaded workflow since it is added to the beginning of the prompt
 * in the chat context, but additional steps are executed as normal
 *
 * @param step
 * @param workflowTrigger
 * @param resourceId
 * @param messages
 * @param resource
 * @param currentFeedback
 */
export async function resourceChatWorkflowExecutor({
	step,
	workflowTrigger,
	resourceId,
	messages,
	resource,
	user,
	openaiProvider,
	partyProvider,
	db,
}: {
	openaiProvider: LlmProviderConfig
	partyProvider: PartyProviderConfig
	db: CourseBuilderAdapter
	resource: ChatResource
	step: any
	workflowTrigger: string
	resourceId: string
	messages: ChatCompletionRequestMessage[]
	user: User
}) {
	const prompt = await step.run('Load Prompt', async () => {
		return db.getContentResource(workflowTrigger)
	})

	if (!prompt) {
		throw new NonRetriableError(`Prompt not found for id (${workflowTrigger})`)
	}

	let systemPrompt: ChatCompletionRequestMessage = {
		role: 'system',
		content: prompt.fields.body,
	}
	let seedMessages: ChatCompletionRequestMessage[] = []

	try {
		const actionParsed = z
			.array(
				z.object({
					role: z.enum([
						ChatCompletionRequestMessageRoleEnum.System,
						ChatCompletionRequestMessageRoleEnum.User,
						ChatCompletionRequestMessageRoleEnum.Assistant,
						ChatCompletionRequestMessageRoleEnum.Function,
					]),
					content: z.string(),
				}),
			)
			.parse(JSON.parse(prompt.fields.body))

		const actionMessages: ChatCompletionRequestMessage[] = []
		for (const actionMessage of actionParsed) {
			const liquidParsedContent = await step.run(
				'parse json content',
				async () => {
					const engine = new Liquid()
					return await engine.parseAndRender(actionMessage.content, {
						...resource,
					})
				},
			)

			actionMessages.push({
				role: actionMessage.role,
				content: liquidParsedContent,
			})
		}
		if (actionMessages.length > 0) {
			;[
				systemPrompt = {
					role: 'system',
					content: prompt.fields.body,
				},
				...seedMessages
			] = actionMessages
		}
	} catch (e: any) {
		// if the prompt action content is not valid json, we assume it's just text
		systemPrompt = await step.run(`parse system prompt`, async () => {
			try {
				const engine = new Liquid()
				return {
					role: systemPrompt.role,
					content: await engine.parseAndRender(
						systemPrompt.content || '',
						resource,
					),
				}
			} catch (e: any) {
				console.error(e.message)
				return {
					role: 'system',
					content: prompt.fields.body,
				}
			}
		})
	}

	if (messages.length <= 2 && systemPrompt) {
		messages = [systemPrompt, ...seedMessages, ...messages]
	}

	const currentUserMessage = messages[messages.length - 1]
	const currentResourceMetadata = messages[messages.length - 2]

	if (currentUserMessage?.content) {
		await step.run(
			`partykit broadcast user prompt [${resourceId}]`,
			async () => {
				await partyProvider.broadcastMessage({
					body: {
						body: currentUserMessage.content,
						requestId: resourceId,
						name: 'resource.chat.prompted',
						userId: user.id,
					},
					roomId: resourceId,
				})
			},
		)
	}

	messages = await step.run('answer the user prompt', async () => {
		if (!currentUserMessage) {
			throw new Error('No user message')
		}
		const engine = new Liquid()
		currentUserMessage.content = await engine.parseAndRender(
			currentUserMessage.content ?? '',
			resource,
		)
		if (currentResourceMetadata) {
			currentResourceMetadata.content = await engine.parseAndRender(
				currentResourceMetadata.content ?? '',
				resource,
			)
		}
		return streamingChatPromptExecutor({
			requestId: resourceId,
			promptMessages: messages,
			model: prompt.model || 'gpt-4-turbo',
			provider: openaiProvider,
		})
	})

	await step.run(`partykit broadcast [${resourceId}]`, async () => {
		return await partyProvider.broadcastMessage({
			body: {
				body: messages,
				requestId: resourceId,
				name: 'resource.chat.completed',
			},
			roomId: resourceId,
		})
	})

	return messages
}
