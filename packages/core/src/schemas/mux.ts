import { z } from 'zod'

export const MuxAssetSchema = z.object({
  id: z.string(),
  status: z.string(),
  tracks: z
    .array(z.object({ type: z.string(), status: z.string(), id: z.string() }))
    .optional()
    .nullable(),
  playback_ids: z.array(
    z.object({
      id: z.string(),
      policy: z.string(),
    }),
  ),
})
