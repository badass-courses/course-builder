import { z } from 'zod'

export const CreateLinkSchema = z.object({
  parentId: z.string(),
  childId: z.string(),
  position: z.number().default(0),
  metadata: z.record(z.string(), z.unknown()).default({}),
})

export type CreateLink = z.infer<typeof CreateLinkSchema>

export const DeleteLinkSchema = z.object({
  parentId: z.string(),
  childId: z.string(),
})

export type DeleteLink = z.infer<typeof DeleteLinkSchema>
