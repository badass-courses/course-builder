import { CreateLinkSchema } from '../schemas/content-resource-graph'
import { validateEdge } from '../schemas/edge-matrix'
import { success, error } from '../schemas/envelope'
import type { HandlerContext, HandlerResult } from './context'

export async function createLink(
  body: unknown,
  ctx: HandlerContext,
): Promise<HandlerResult> {
  try {
    const parsed = CreateLinkSchema.safeParse(body)

    if (!parsed.success) {
      return {
        status: 400,
        body: error('Invalid request body', 'VALIDATION_ERROR', parsed.error.flatten()),
      }
    }

    const { parentId, childId, position, metadata } = parsed.data

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

    if (ctx.registry) {
      const edges = ctx.registry.getEdges()
      if (edges.length > 0 && !validateEdge(edges, parent.type, child.type)) {
        return {
          status: 422,
          body: error(
            `Cannot link ${parent.type} -> ${child.type}: not an allowed edge`,
            'INVALID_EDGE',
          ),
        }
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

    const link = await ctx.adapter.addResourceToResource({
      parentResourceId: parentId,
      childResourceId: childId,
      position,
      metadata,
    })

    if (!link) {
      return {
        status: 500,
        body: error('Failed to create link', 'CREATE_LINK_ERROR'),
      }
    }

    return {
      status: 201,
      body: success(link),
    }
  } catch (err) {
    return {
      status: 500,
      body: error(
        err instanceof Error ? err.message : 'Failed to create link',
        'CREATE_LINK_ERROR',
      ),
    }
  }
}
