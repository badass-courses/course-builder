import { sanityQuery } from '@/server/sanity.server'
import z from 'zod'

export const VideoResourceSchema = z.object({
  _id: z.string(),
  _type: z.string(),
  _updatedAt: z.string(),
  title: z.string(),
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

export async function getVideoResource(id: string | null, tags: string[] = []): Promise<VideoResource | null> {
  if (!id) {
    return null
  }
  const videoResourceData = await sanityQuery<VideoResource | null>(
    `*[(_id == "${id}")][0]{
        _id,
        _type,
        "_updatedAt": ^._updatedAt,
        title,
        duration,
        muxAssetId,
        transcript,
        state,
        srt,
        wordLevelSrt,
        muxPlaybackId,
        transcriptWithScreenshots
  }`,
    { tags },
  )

  const videoResource = VideoResourceSchema.safeParse(videoResourceData)

  if (videoResource.success) {
    return videoResource.data
  }

  return null
}
