import { success, error } from '../schemas/envelope'
import type { HandlerContext, HandlerResult } from './context'

export async function deleteResource(
  id: string,
  ctx: HandlerContext,
): Promise<HandlerResult> {
  try {
    if (!ctx.user) {
      return { status: 401, body: error('Unauthorized', 'UNAUTHORIZED') }
    }

    const resource = await ctx.adapter.getContentResource(id)
    if (!resource) {
      return { status: 404, body: error('Resource not found', 'NOT_FOUND') }
    }

    if (ctx.registry) {
      const typeDef = ctx.registry.getTypeDefinition(resource.type)
      if (typeDef && !typeDef.operations.includes('delete')) {
        return {
          status: 403,
          body: error(`Delete not allowed for type: ${resource.type}`, 'OPERATION_NOT_ALLOWED'),
        }
      }
    }

    const canRead = await ctx.authorize.canReadResource({ resource, user: ctx.user })
    if (!canRead) {
      return { status: 403, body: error('Forbidden', 'FORBIDDEN') }
    }

    await ctx.adapter.updateContentResourceFields({
      id,
      fields: { state: 'deleted' },
    })

    return { status: 200, body: success({ deleted: true }) }
  } catch (err) {
    return {
      status: 500,
      body: error(
        err instanceof Error ? err.message : 'Failed to delete resource',
        'DELETE_RESOURCE_ERROR',
      ),
    }
  }
}
