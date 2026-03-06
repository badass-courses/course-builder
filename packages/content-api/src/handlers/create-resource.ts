import { CreateResourceSchema } from '../schemas/content-resource-write'
import { success, error } from '../schemas/envelope'
import type { HandlerContext, HandlerResult } from './context'

export async function createResource(
  body: unknown,
  ctx: HandlerContext,
): Promise<HandlerResult> {
  try {
    if (!ctx.user) {
      return { status: 401, body: error('Unauthorized', 'UNAUTHORIZED') }
    }

    const parsed = CreateResourceSchema.safeParse(body)
    if (!parsed.success) {
      return {
        status: 400,
        body: error('Invalid request body', 'VALIDATION_ERROR', parsed.error.flatten()),
      }
    }

    const { type, fields } = parsed.data

    if (ctx.registry) {
      const typeDef = ctx.registry.getTypeDefinition(type)
      if (typeDef && !typeDef.operations.includes('create')) {
        return {
          status: 403,
          body: error(`Create not allowed for type: ${type}`, 'OPERATION_NOT_ALLOWED'),
        }
      }
    }

    const resource = await ctx.adapter.createContentResource({
      id: crypto.randomUUID(),
      type,
      fields: fields as Record<string, any>,
      createdById: ctx.user.id,
    })

    return { status: 201, body: success(resource) }
  } catch (err) {
    return {
      status: 500,
      body: error(
        err instanceof Error ? err.message : 'Failed to create resource',
        'CREATE_RESOURCE_ERROR',
      ),
    }
  }
}
