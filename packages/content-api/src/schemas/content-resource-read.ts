import { z } from 'zod'
import {
  ContentResourceSchema,
  ResourceStateSchema,
  ResourceVisibilitySchema,
} from '@coursebuilder/core/schemas/content-resource-schema'
import { PaginationSchema } from './envelope'

export const ContentResourceQuerySchema = z.object({
  type: z.string().optional(),
  state: ResourceStateSchema.optional(),
  visibility: ResourceVisibilitySchema.optional(),
  organizationId: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(25),
  sort: z.enum(['createdAt', 'updatedAt', 'title']).default('updatedAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
})

export type ContentResourceQuery = z.infer<typeof ContentResourceQuerySchema>

export const ContentResourceReadSchema = ContentResourceSchema.extend({
  childCount: z.number().optional(),
})

export type ContentResourceRead = z.infer<typeof ContentResourceReadSchema>

export const ContentResourceListResponseSchema = z.object({
  data: z.array(ContentResourceReadSchema),
  pagination: PaginationSchema,
})

export type ContentResourceListResponse = z.infer<
  typeof ContentResourceListResponseSchema
>
