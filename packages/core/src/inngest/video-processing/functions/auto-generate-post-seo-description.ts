import { NonRetriableError } from 'inngest'

import { resourceChatWorkflowExecutor } from '../../co-gardener/resource-chat'
import {
	CoreInngestFunctionInput,
	CoreInngestHandler,
	CoreInngestTrigger,
} from '../../create-inngest-middleware'
import { VIDEO_TRANSCRIPT_READY_EVENT } from '../events/event-video-transcript-ready'

const autoGeneratePostSeoDescriptionConfig = {
	id: 'auto-generate-post-seo-description',
	name: 'Auto-Generate SEO Description',
}

const autoGeneratePostSeoDescriptionTrigger: CoreInngestTrigger = {
	event: VIDEO_TRANSCRIPT_READY_EVENT,
}

const autoGeneratePostSeoDescriptionHandler: CoreInngestHandler = async ({
	event,
	step,
	db,
	openaiProvider,
	partyProvider,
}: CoreInngestFunctionInput) => {
	const videoResourceId = event.data.videoResourceId

	if (!videoResourceId) {
		throw new NonRetriableError('video resource id is required')
	}

	// Step 1: Find the parent resource (post or lesson) of this video
	const resource = await step.run('find parent resource of video', async () => {
		return await db.getParentResourceOfVideoResource(videoResourceId)
	})

	if (!resource) {
		// Not an error - video might not belong to a post or lesson
		return {
			skipped: true,
			reason: 'video does not belong to a post or lesson',
			videoResourceId,
		}
	}

	// Step 2: Check if description already exists
	const hasDescription =
		resource.fields?.description &&
		typeof resource.fields.description === 'string' &&
		resource.fields.description.trim() !== ''

	if (hasDescription) {
		return {
			skipped: true,
			reason: 'resource already has description',
			resourceId: resource.id,
			resourceType: resource.type,
			videoResourceId,
		}
	}

	// Step 3: Get the resource creator user
	const user = await step.run('get resource creator', async () => {
		return await db.getUserById(resource.createdById)
	})

	if (!user) {
		throw new NonRetriableError(
			`User not found for resource creator id: ${resource.createdById}`,
		)
	}

	// Step 4: Get video resource for transcript data
	const videoResource = await step.run('get video resource', async () => {
		return await db.getVideoResource(videoResourceId)
	})

	// Step 5: Execute SEO description generation directly
	const contentType = resource.type === 'lesson' ? 'lesson' : 'post'

	// Convert dates to ISO strings if they are Date objects, otherwise use as-is
	const updatedAtStr = resource.updatedAt
		? typeof resource.updatedAt === 'object' &&
			'toISOString' in resource.updatedAt
			? (resource.updatedAt as Date).toISOString()
			: String(resource.updatedAt)
		: null
	const createdAtStr = resource.createdAt
		? typeof resource.createdAt === 'object' &&
			'toISOString' in resource.createdAt
			? (resource.createdAt as Date).toISOString()
			: String(resource.createdAt)
		: null

	const messages = await resourceChatWorkflowExecutor({
		step,
		workflowTrigger: 'prompt-0541t',
		resourceId: resource.id,
		messages: [
			{
				role: 'user',
				content: `Generate a SEO-friendly description for this ${contentType}. The description should be under 160 characters, include relevant keywords, and be compelling for search results.`,
			},
		],
		resource: {
			id: resource.id,
			type: resource.type,
			updatedAt: updatedAtStr,
			createdAt: createdAtStr,
			title: resource.fields?.title ?? null,
			body: resource.fields?.body ?? null,
			transcript: videoResource?.transcript ?? null,
			wordLevelSrt: videoResource?.wordLevelSrt ?? null,
			resources: resource.resources ?? [],
		},
		// User type is compatible at runtime, cast to bypass Inngest's JSON serialization type mismatch
		user: user as any,
		openaiProvider,
		partyProvider,
		db,
	})

	// Step 6: Extract and save the generated description
	const lastMessage = messages[messages.length - 1]
	if (lastMessage?.content) {
		// Remove markdown code blocks if present
		const description = String(lastMessage.content).replace(
			/```.*\n(.*)\n```/s,
			'$1',
		)

		await step.run('save description to resource', async () => {
			await db.updateContentResourceFields({
				id: resource.id,
				fields: {
					...resource.fields,
					description: description.trim(),
				},
			})
		})

		return {
			success: true,
			resourceId: resource.id,
			resourceType: resource.type,
			userId: user.id,
			videoResourceId,
			description: description.trim(),
		}
	}

	return {
		success: false,
		reason: 'no description generated',
		resourceId: resource.id,
		resourceType: resource.type,
		userId: user.id,
		videoResourceId,
	}
}

export const autoGeneratePostSeoDescription = {
	config: autoGeneratePostSeoDescriptionConfig,
	trigger: autoGeneratePostSeoDescriptionTrigger,
	handler: autoGeneratePostSeoDescriptionHandler,
}
