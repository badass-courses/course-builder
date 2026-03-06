import { success, error } from '../schemas/envelope'
import type { HandlerContext, HandlerResult } from './context'

export async function getParents(
  id: string,
  ctx: HandlerContext,
): Promise<HandlerResult> {
  try {
    const resource = await ctx.adapter.getContentResource(id)

    if (!resource) {
      return {
        status: 404,
        body: error('Resource not found', 'NOT_FOUND'),
      }
    }

    const canRead = await ctx.authorize.canReadResource({
      resource,
      user: ctx.user,
    })

    if (!canRead) {
      return {
        status: 403,
        body: error('Forbidden', 'FORBIDDEN'),
      }
    }

    const parents = await ctx.adapter.getResourceParents(id)

    return {
      status: 200,
      body: success(parents),
    }
  } catch (err) {
    return {
      status: 500,
      body: error(
        err instanceof Error ? err.message : 'Failed to get parents',
        'GET_PARENTS_ERROR',
      ),
    }
  }
}
