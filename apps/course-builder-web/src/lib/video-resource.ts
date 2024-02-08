import z from 'zod'

export const VideoResourceSchema = z.object({
  _id: z.string(),
  muxPlaybackId: z.string().optional(),
  muxAssetId: z.string().optional(),
  transcript: z.string().optional(),
  srt: z.string().optional(),
  state: z.enum(['new', 'processing', 'preparing', 'ready', 'errored']),
})

export type VideoResource = z.infer<typeof VideoResourceSchema>
