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
		model?: string
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
export const resourceChatHandler: CoreInngestHandler = async ({
	event,
	step,
	openaiProvider,
	partyProvider,
	db,
}: CoreInngestFunctionInput) => {
	const resourceId = event.data.resourceId
	const workflowTrigger = event.data.selectedWorkflow

	const currentUserMessage = event.data.messages[event.data.messages.length - 1]

	if (currentUserMessage?.content) {
		await step.run(
			`partykit broadcast user prompt [${resourceId}]`,
			async () => {
				await partyProvider.broadcastMessage({
					body: {
						body: currentUserMessage.content,
						requestId: resourceId,
						name: 'resource.chat.prompted',
						// @ts-expect-error
						userId: event.user.id,
					},
					roomId: resourceId,
				})
			},
		)
	}

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
	model,
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
	model?: string
}) {
	const basicPrompt = {
		id: 'basic',
		name: 'Basic',
		type: 'prompt',
		fields: {
			body: `# Instructions
Pause. Take a deep breath and think. This is important. Think step by step.

You are serving as a writing assistant for a content creator that is publishing a {% if transcript %}video based{% endif %} post for software developers. The content creator will ask questions and expect concise answers that aren't corny or generic.

Keep responses scoped to the post and it's direct contents. Do not include additional information.
Do not include information that is not directly related to the post or the {% if transcript %}video{% endif %}.

Use simple language.

Use only most popular 2000 english words {% if transcript %}and words used in the transcript{% endif %}.
Simple is better.
Flourish is bad.
**People will hate you if you try to sound clever.**

{% if wordLevelSrt %} add screenshots from the video when they are relevant and would be useful to
the reader using the following template replacing {{timestampInSeconds}} with the time noted in the transcript:

![{{descriptiveAltTextForVisuallyImpaired}}](https://image.mux.com/{{muxPlaybackId}}/thumbnail.png?time={{timestampInSeconds}})
be precise with the timestamps! {% if wordLevelSrt %} use this word level SRT to get the exact timestamp:

word level srt start
{{wordLevelSrt}} {% endif %}

word level srt end
{% endif %}

Get it right and there's $200 cash gratuity in it for you ;)

{% if transcript %}The goal is to build a really good written version of the existing video, not edit the video itself. The video is done.

The post transcript is the final representation of the video. The post transcript is the source of truth.{% endif %}

Keep the language simple and don't use words not in the post {% if transcript %}transcript{% endif %}.

{% if transcript %}Do not make direct references to the video.
Do not make direct references to the transcript.{% endif %}
Do not make direct references to the content creator.
Do not make direct references to 'the post'.
Jump right to the point.

Post Title: {{title}}

{% if transcript %}Post Transcript: {{transcript}}{% endif %}

Post Body: {{body}}

Reply in a markdown code fence.`,
		},
	}

	const prompt =
		workflowTrigger === 'basic'
			? basicPrompt
			: await step.run('Load Prompt', async () => {
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
			model: prompt.fields.model || model || 'gpt-4-turbo',
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

export const resourceChat = {
	config: resourceChatConfig,
	trigger: resourceChatTrigger,
	handler: resourceChatHandler,
}
