import { z } from 'zod'

export const CreateResourceSchema = z.object({
  type: z.string(),
  fields: z.record(z.string(), z.unknown()).default({}),
})

export type CreateResource = z.infer<typeof CreateResourceSchema>

export const UpdateResourceFieldsSchema = z.object({
  fields: z.record(z.string(), z.unknown()),
})

export type UpdateResourceFields = z.infer<typeof UpdateResourceFieldsSchema>
