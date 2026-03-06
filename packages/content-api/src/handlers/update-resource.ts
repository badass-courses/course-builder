import { UpdateResourceFieldsSchema } from '../schemas/content-resource-write'
import { success, error } from '../schemas/envelope'
import type { HandlerContext, HandlerResult } from './context'

export async function updateResource(
  id: string,
  body: unknown,
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
      if (typeDef && !typeDef.operations.includes('update')) {
        return {
          status: 403,
          body: error(`Update not allowed for type: ${resource.type}`, 'OPERATION_NOT_ALLOWED'),
        }
      }
    }

    const canRead = await ctx.authorize.canReadResource({ resource, user: ctx.user })
    if (!canRead) {
      return { status: 403, body: error('Forbidden', 'FORBIDDEN') }
    }

    const parsed = UpdateResourceFieldsSchema.safeParse(body)
    if (!parsed.success) {
      return {
        status: 400,
        body: error('Invalid request body', 'VALIDATION_ERROR', parsed.error.flatten()),
      }
    }

    const updated = await ctx.adapter.updateContentResourceFields({
      id,
      fields: parsed.data.fields as Record<string, any>,
    })

    if (!updated) {
      return { status: 500, body: error('Failed to update resource', 'UPDATE_RESOURCE_ERROR') }
    }

    return { status: 200, body: success(updated) }
  } catch (err) {
    return {
      status: 500,
      body: error(
        err instanceof Error ? err.message : 'Failed to update resource',
        'UPDATE_RESOURCE_ERROR',
      ),
    }
  }
}
