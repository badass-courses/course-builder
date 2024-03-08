import z from 'zod'

export const VideoResourceSchema = z.object({
  _id: z.string().optional(),
  _updatedAt: z.string().optional(),
  _createdAt: z.string().optional(),
  title: z.string().optional().nullable(),
  duration: z.number().optional().nullable(),
  muxPlaybackId: z.string().optional().nullable(),
  muxAssetId: z.string().optional().nullable(),
  transcript: z.string().optional().nullable(),
  transcriptWithScreenshots: z.string().optional().nullable(),
  srt: z.string().optional().nullable(),
  wordLevelSrt: z.string().optional().nullable(),
  state: z.enum(['new', 'processing', 'preparing', 'ready', 'errored']),
})

export type VideoResource = z.infer<typeof VideoResourceSchema>
