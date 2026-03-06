import { z } from 'zod'
import {
  ResourceStateSchema,
} from '@coursebuilder/core/schemas/content-resource-schema'
import { EdgeRuleSchema, type EdgeRule } from './edge-matrix'

export const ResourceOperationSchema = z.enum([
  'create',
  'read',
  'update',
  'delete',
])

export type ResourceOperation = z.infer<typeof ResourceOperationSchema>

export type ResourceTypeDefinition = {
  type: string
  label: string
  operations: ResourceOperation[]
  fieldsSchema: z.ZodType<unknown>
  states: z.infer<typeof ResourceStateSchema>[]
}

export type ContentModelConstraints = {
  maxDepth?: number
}

export type ContentModel = {
  resourceTypes: ResourceTypeDefinition[]
  edges: EdgeRule[]
  constraints: ContentModelConstraints
}

export const ContentModelResponseSchema = z.object({
  resourceTypes: z.array(
    z.object({
      type: z.string(),
      label: z.string(),
      operations: z.array(ResourceOperationSchema),
      fieldsJsonSchema: z.record(z.string(), z.unknown()),
      states: z.array(z.string()),
    }),
  ),
  edges: z.array(EdgeRuleSchema),
  constraints: z
    .object({
      maxDepth: z.number().optional(),
    })
    .optional(),
})

export type ContentModelResponse = z.infer<typeof ContentModelResponseSchema>

export type SchemaRegistry = {
  register(
    type: string,
    fieldsSchema: z.ZodType<unknown>,
    operations: ResourceOperation[],
    options?: { label?: string; states?: z.infer<typeof ResourceStateSchema>[] },
  ): SchemaRegistry
  withEdges(edges: EdgeRule[]): SchemaRegistry
  withConstraints(constraints: ContentModelConstraints): SchemaRegistry
  getModel(): ContentModel
  getEdges(): EdgeRule[]
  getTypeDefinition(type: string): ResourceTypeDefinition | undefined
  getRegisteredTypes(): string[]
}

export function createSchemaRegistry(): SchemaRegistry {
  const types = new Map<string, ResourceTypeDefinition>()
  let edges: EdgeRule[] = []
  let constraints: ContentModelConstraints = {}

  const registry: SchemaRegistry = {
    register(type, fieldsSchema, operations, options) {
      types.set(type, {
        type,
        label: options?.label ?? type,
        operations,
        fieldsSchema,
        states: options?.states ?? ['draft', 'published', 'archived', 'deleted'],
      })
      return registry
    },

    withEdges(newEdges) {
      edges = newEdges
      return registry
    },

    withConstraints(newConstraints) {
      constraints = newConstraints
      return registry
    },

    getModel() {
      return {
        resourceTypes: Array.from(types.values()),
        edges,
        constraints,
      }
    },

    getEdges() {
      return edges
    },

    getTypeDefinition(type) {
      return types.get(type)
    },

    getRegisteredTypes() {
      return Array.from(types.keys())
    },
  }

  return registry
}
