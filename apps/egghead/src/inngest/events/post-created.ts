import { ContentResource } from '@coursebuilder/core/schemas'

export const POST_CREATED_EVENT = 'post/created'
export type PostCreated = {
	name: typeof POST_CREATED_EVENT
	data: {
		post: ContentResource
	}
}
