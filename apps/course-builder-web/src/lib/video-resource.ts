import { sanityQuery } from '@/server/sanity.server'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'
import z from 'zod'

export const VideoResourceSchema = z.object({
  _id: z.string(),
  _type: z.string(),
  _updatedAt: z.string(),
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

/**
 * This is the schema for the video resource after it has been migrated to the mysql
 * database as a `contentResource`.
 */
export const MigratedVideoResourceSchema = z.object({
  createdById: z.string(),
  title: z.string(),
  type: z.string(),
  slug: z.string(),
  body: z.string().nullable(),
  id: z.string(),
  metadata: z.object({
    state: z.string(),
    muxPlaybackId: z.string(),
    muxAssetId: z.string(),
    duration: z.number().optional(),
    transcript: z.string().optional().nullable(),
    transcriptWithScreenshots: z.string().optional().nullable(),
    srt: z.string().optional().nullable(),
    wordLevelSrt: z.string().optional().nullable(),
  }),
})

export function convertToMigratedResource({
  videoResource,
  ownerUserId,
}: {
  videoResource: VideoResource
  ownerUserId?: string
}) {
  return MigratedVideoResourceSchema.parse({
    ...(ownerUserId ? { createdById: ownerUserId } : {}),
    title: videoResource.title || 'Untitled Video',
    type: 'videoResource',
    slug: slugify(videoResource.title || `untitled-video-${guid()}`),
    body: null,
    id: videoResource._id,
    resources: [
      ...(videoResource.transcript
        ? [
            {
              _type: `transcript`,
              _key: `transcript-${guid()}`,
              text: videoResource.transcript,
            },
          ]
        : []),
      ...(videoResource.srt
        ? [
            {
              _type: `srt`,
              _key: `srt-${guid()}`,
              text: videoResource.srt,
            },
          ]
        : []),
      ...(videoResource.wordLevelSrt
        ? [
            {
              _type: `wordLevelSrt`,
              _key: `wordLevelSrt-${guid()}`,
              text: videoResource.wordLevelSrt,
            },
          ]
        : []),
      ...(videoResource.transcriptWithScreenshots
        ? [
            {
              _type: `transcriptWithScreenshots`,
              _key: `transcriptWithScreenshots-${guid()}`,
              text: videoResource.transcriptWithScreenshots,
            },
          ]
        : []),
    ],
    metadata: {
      state: videoResource.state,
      muxPlaybackId: videoResource.muxPlaybackId,
      muxAssetId: videoResource.muxAssetId,
      ...(videoResource.duration ? { duration: videoResource.duration } : null),
    },
  })
}

export async function getVideoResource(id: string | null, tags: string[] = []): Promise<VideoResource | null> {
  if (!id) {
    return null
  }
  const videoResourceData = await sanityQuery<VideoResource | null>(
    `*[(_id == "${id}")][0]{
        _id,
        _type,
        _updatedAt,
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

  console.error('Failed to parse video resource', videoResource.error)

  return null
}
