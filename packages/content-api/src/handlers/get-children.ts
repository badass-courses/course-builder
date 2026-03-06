import { success, error } from '../schemas/envelope'
import type { HandlerContext, HandlerResult } from './context'

export async function getChildren(
  id: string,
  ctx: HandlerContext,
): Promise<HandlerResult> {
  try {
    const parent = await ctx.adapter.getContentResource(id)

    if (!parent) {
      return {
        status: 404,
        body: error('Parent resource not found', 'NOT_FOUND'),
      }
    }

    const canRead = await ctx.authorize.canReadResource({
      resource: parent,
      user: ctx.user,
    })

    if (!canRead) {
      return {
        status: 403,
        body: error('Forbidden', 'FORBIDDEN'),
      }
    }

    const children = await ctx.adapter.getResourceChildren(id)

    return {
      status: 200,
      body: success(children),
    }
  } catch (err) {
    return {
      status: 500,
      body: error(
        err instanceof Error ? err.message : 'Failed to get children',
        'GET_CHILDREN_ERROR',
      ),
    }
  }
}
