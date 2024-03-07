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

export const TextResourceSchema = z.object({
  _type: z.string(),
  _key: z.string(),
  text: z.string(),
})

/**
 * This is the schema for the video resource after it has been migrated to the mysql
 * database as a `contentResource`.
 */
export const MigratedVideoResourceSchema = z.object({
  createdById: z.string(),
  type: z.string(),
  id: z.string(),
  updatedAt: z.date(),
  createdAt: z.date(),
  fields: z.object({
    title: z.string(),
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

export function convertToMigratedVideoResource({
  videoResource,
  ownerUserId,
}: {
  videoResource: VideoResource
  ownerUserId?: string
}) {
  return MigratedVideoResourceSchema.parse({
    ...(ownerUserId ? { createdById: ownerUserId } : {}),
    type: 'videoResource',
    id: videoResource._id,
    updatedAt: new Date(videoResource._updatedAt || new Date().toISOString()),
    createdAt: new Date(videoResource._createdAt || new Date().toISOString()),
    fields: {
      title: videoResource.title || 'Untitled Video',
      state: videoResource.state,
      muxPlaybackId: videoResource.muxPlaybackId,
      muxAssetId: videoResource.muxAssetId,
      ...(videoResource.duration ? { duration: videoResource.duration } : null),
      ...(videoResource.transcript ? { transcript: videoResource.transcript } : null),
      ...(videoResource.transcriptWithScreenshots
        ? { transcriptWithScreenshots: videoResource.transcriptWithScreenshots }
        : null),
      ...(videoResource.srt ? { srt: videoResource.srt } : null),
      ...(videoResource.wordLevelSrt ? { wordLevelSrt: videoResource.wordLevelSrt } : null),
    },
  })
}
