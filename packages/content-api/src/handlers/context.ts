import type { CourseBuilderAdapter } from '@coursebuilder/core/adapters'
import type { ContentResource } from '@coursebuilder/core/schemas/content-resource-schema'
import type { AuthorizationPolicy, User } from '../auth/policy'
import type { SchemaRegistry } from '../schemas/content-model'
import type { ContentResourceQuery } from '../schemas/content-resource-read'
import type { Pagination } from '../schemas/envelope'

export type HandlerResult = {
  status: number
  body: unknown
  headers?: Record<string, string>
}

export type ContentApiAdapter = CourseBuilderAdapter & {
  queryContentResources(params: ContentResourceQuery): Promise<{
    data: ContentResource[]
    pagination: Pagination
  }>
  getResourceChildren(id: string): Promise<ContentResource[]>
  getResourceParents(id: string): Promise<ContentResource[]>
  createVersionSnapshot?(
    resourceId: string,
    userId: string,
    fields: Record<string, unknown>,
  ): Promise<{ resourceId: string; versionNumber: number; fields: Record<string, unknown> }>
}

export type HandlerContext = {
  adapter: ContentApiAdapter
  authorize: AuthorizationPolicy
  registry?: SchemaRegistry
  user?: User
}
