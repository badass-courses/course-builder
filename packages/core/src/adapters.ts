import { type Adapter } from '@auth/core/adapters'

import { VideoResource } from './schemas/video-resource'
import {
	ContentResourceResource,
	type Awaitable,
	type ContentResource,
} from './types'

export interface CourseBuilderAdapter extends Adapter {
	addResourceToResource(options: {
		childResourceId: string
		parentResourceId: string
	}): Awaitable<ContentResourceResource | null>
	createContentResource(resource: {
		id: string
		type: string
		fields: Record<string, any>
		createdById: string
	}): Awaitable<ContentResource>
	getContentResource(id: string): Awaitable<ContentResource | null>
	getVideoResource(id: string): Awaitable<VideoResource | null>
	updateContentResourceFields(options: {
		id: string
		fields: Record<string, any>
	}): Awaitable<ContentResource | null>
}

export const MockCourseBuilderAdapter: CourseBuilderAdapter = {
	addResourceToResource: async (options) => {
		return {} as ContentResourceResource
	},
	createContentResource: async (resource) => {
		return resource as ContentResource
	},
	getContentResource: async (_) => {
		return null
	},
	getVideoResource: async (_) => {
		return null
	},
	updateContentResourceFields(_) {
		return null
	},
}
