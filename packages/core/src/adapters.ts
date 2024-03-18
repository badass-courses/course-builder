import { type Adapter } from '@auth/core/adapters'

import { VideoResource } from './schemas/video-resource'
import { type Awaitable, type ContentResource } from './types'

export interface CourseBuilderAdapter extends Adapter {
  createContentResource: (resource: ContentResource) => Awaitable<ContentResource>
  getContentResource: (id: string) => Awaitable<ContentResource | null>
  getVideoResource: (id: string) => Awaitable<VideoResource | null>
}

export const MockCourseBuilderAdapter: CourseBuilderAdapter = {
  createContentResource: async (resource) => {
    return resource
  },
  getContentResource: async (id) => {
    return null
  },
  getVideoResource: async (id) => {
    return null
  },
}
