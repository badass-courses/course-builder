import { NonRetriableError } from 'inngest'

import { RESOURCE_CHAT_REQUEST_EVENT } from '../../co-gardener/resource-chat'
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

	// Step 4: Trigger SEO description generation
	const contentType = resource.type === 'lesson' ? 'lesson' : 'post'
	await step.sendEvent('trigger seo description generation', {
		name: RESOURCE_CHAT_REQUEST_EVENT,
		data: {
			resourceId: resource.id,
			messages: [
				{
					role: 'user',
					content: `Generate a SEO-friendly description for this ${contentType}. The description should be under 160 characters, include relevant keywords, and be compelling for search results.`,
				},
			],
			selectedWorkflow: 'prompt-0541t',
		},
		user: {
			id: user.id,
			email: user.email || '',
		},
	})

	return {
		success: true,
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
