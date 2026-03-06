import { DeleteLinkSchema } from '../schemas/content-resource-graph'
import { success, error } from '../schemas/envelope'
import type { HandlerContext, HandlerResult } from './context'

export async function deleteLink(
  body: unknown,
  ctx: HandlerContext,
): Promise<HandlerResult> {
  try {
    const parsed = DeleteLinkSchema.safeParse(body)

    if (!parsed.success) {
      return {
        status: 400,
        body: error('Invalid request body', 'VALIDATION_ERROR', parsed.error.flatten()),
      }
    }

    const { parentId, childId } = parsed.data

    const [parent, child] = await Promise.all([
      ctx.adapter.getContentResource(parentId),
      ctx.adapter.getContentResource(childId),
    ])

    if (!parent) {
      return {
        status: 404,
        body: error('Parent resource not found', 'PARENT_NOT_FOUND'),
      }
    }

    if (!child) {
      return {
        status: 404,
        body: error('Child resource not found', 'CHILD_NOT_FOUND'),
      }
    }

    const canManage = await ctx.authorize.canManageLink({
      parent,
      child,
      user: ctx.user,
    })

    if (!canManage) {
      return {
        status: 403,
        body: error('Forbidden', 'FORBIDDEN'),
      }
    }

    await ctx.adapter.removeResourceFromResource({
      parentResourceId: parentId,
      childResourceId: childId,
    })

    return {
      status: 200,
      body: success({ deleted: true }),
    }
  } catch (err) {
    return {
      status: 500,
      body: error(
        err instanceof Error ? err.message : 'Failed to delete link',
        'DELETE_LINK_ERROR',
      ),
    }
  }
}
