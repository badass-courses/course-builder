import { zodToJsonSchema } from 'zod-to-json-schema'
import type { ContentModelResponse } from '../schemas/content-model'
import { success, error } from '../schemas/envelope'
import type { HandlerContext, HandlerResult } from './context'

export async function getContentModel(
  ctx: HandlerContext,
): Promise<HandlerResult> {
  try {
    if (!ctx.registry) {
      return {
        status: 501,
        body: error(
          'Content model registry not configured',
          'REGISTRY_NOT_CONFIGURED',
        ),
      }
    }

    const model = ctx.registry.getModel()

    const response: ContentModelResponse = {
      resourceTypes: model.resourceTypes.map((rt) => ({
        type: rt.type,
        label: rt.label,
        operations: rt.operations,
        fieldsJsonSchema: zodToJsonSchema(rt.fieldsSchema) as Record<
          string,
          unknown
        >,
        states: rt.states,
      })),
      edges: model.edges,
      constraints: model.constraints,
    }

    return {
      status: 200,
      body: success(response),
    }
  } catch (err) {
    return {
      status: 500,
      body: error(
        err instanceof Error ? err.message : 'Failed to get content model',
        'CONTENT_MODEL_ERROR',
      ),
    }
  }
}
