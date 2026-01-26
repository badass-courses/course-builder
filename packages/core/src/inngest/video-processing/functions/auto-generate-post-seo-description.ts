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
	name: 'Auto-Generate Post SEO Description',
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

	// Step 1: Find the parent post of this video resource
	const post = await step.run('find parent post of video', async () => {
		return await db.getParentResourceOfVideoResource(videoResourceId)
	})

	if (!post) {
		// Not an error - video might not belong to a post (could be a lesson, etc.)
		return {
			skipped: true,
			reason: 'video does not belong to a post',
			videoResourceId,
		}
	}

	// Step 2: Check if description already exists
	const hasDescription =
		post.fields?.description &&
		typeof post.fields.description === 'string' &&
		post.fields.description.trim() !== ''

	if (hasDescription) {
		return {
			skipped: true,
			reason: 'post already has description',
			postId: post.id,
			videoResourceId,
		}
	}

	// Step 3: Get the post creator user
	const user = await step.run('get post creator', async () => {
		return await db.getUserById(post.createdById)
	})

	if (!user) {
		throw new NonRetriableError(
			`User not found for post creator id: ${post.createdById}`,
		)
	}

	// Step 4: Trigger SEO description generation
	await step.sendEvent('trigger seo description generation', {
		name: RESOURCE_CHAT_REQUEST_EVENT,
		data: {
			resourceId: post.id,
			messages: [
				{
					role: 'user',
					content:
						'Generate a SEO-friendly description for this post. The description should be under 160 characters, include relevant keywords, and be compelling for search results.',
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
		postId: post.id,
		userId: user.id,
		videoResourceId,
	}
}

export const autoGeneratePostSeoDescription = {
	config: autoGeneratePostSeoDescriptionConfig,
	trigger: autoGeneratePostSeoDescriptionTrigger,
	handler: autoGeneratePostSeoDescriptionHandler,
}
