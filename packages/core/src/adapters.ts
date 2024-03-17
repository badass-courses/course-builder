import { type Adapter } from '@auth/core/adapters'

import { type Awaitable, type ContentResource } from './types'

export interface CourseBuilderAdapter extends Adapter {
  createContentResource: (resource: ContentResource) => Awaitable<ContentResource>
  getContentResource: (id: string) => Awaitable<ContentResource | null>
}
