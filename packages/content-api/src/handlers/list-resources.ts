import type { ContentResourceQuery } from '../schemas/content-resource-read'
import { success, error } from '../schemas/envelope'
import type { HandlerContext, HandlerResult } from './context'

export async function listResources(
  params: ContentResourceQuery,
  ctx: HandlerContext,
): Promise<HandlerResult> {
  try {
    const result = await ctx.adapter.queryContentResources(params)

    const filteredData = []
    for (const resource of result.data) {
      const canRead = await ctx.authorize.canReadResource({
        resource,
        user: ctx.user,
      })
      if (canRead) {
        filteredData.push(resource)
      }
    }

    return {
      status: 200,
      body: success(
        { data: filteredData, pagination: result.pagination },
      ),
    }
  } catch (err) {
    return {
      status: 500,
      body: error(
        err instanceof Error ? err.message : 'Failed to list resources',
        'LIST_RESOURCES_ERROR',
      ),
    }
  }
}
