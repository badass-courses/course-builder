import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { sanityQuery } from '@/server/sanity.server'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'
import { sql } from 'drizzle-orm'
import z from 'zod'

export const VideoResourceSchema = z.object({
  _id: z.string().optional(),
  _updatedAt: z.string().optional(),
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
  slug: z.string(),
  id: z.string(),
  resources: z.array(TextResourceSchema).default([]),
  metadata: z.object({
    title: z.string(),
    state: z.string(),
    muxPlaybackId: z.string(),
    muxAssetId: z.string(),
    duration: z.number().optional(),
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
    slug: slugify(videoResource.title || `untitled-video-${guid()}`),
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
      title: videoResource.title || 'Untitled Video',
      state: videoResource.state,
      muxPlaybackId: videoResource.muxPlaybackId,
      muxAssetId: videoResource.muxAssetId,
      ...(videoResource.duration ? { duration: videoResource.duration } : null),
    },
  })
}

export async function getVideoResource(videoResourceId: string | null): Promise<VideoResource | null> {
  if (!videoResourceId) {
    return null
  }
  const query = sql`
    SELECT
      id,
      transcriptResources.text AS transcript,
      JSON_EXTRACT (${contentResource.metadata}, "$.state") AS state,
      JSON_EXTRACT (${contentResource.metadata}, "$.duration") AS duration,
      JSON_EXTRACT (${contentResource.metadata}, "$.muxPlaybackId") AS muxPlaybackId
    FROM
      ${contentResource},
      JSON_TABLE (
        ${contentResource.resources},
        '$[*]' COLUMNS (
          _type VARCHAR(255) PATH '$._type',
          text TEXT PATH '$.text'
        )
      ) AS transcriptResources
    WHERE
      type = 'videoResource'
      AND transcriptResources._type = 'transcript'
      AND (id = ${videoResourceId});
 `
  return db
    .execute(query)
    .then((result) => {
      const parsedResource = VideoResourceSchema.safeParse(result.rows[0])
      return parsedResource.success ? parsedResource.data : null
    })
    .catch((error) => {
      return error
    })
}

export async function getTranscript(videoResourceId: string | null) {
  if (!videoResourceId) {
    return null
  }
  const query = sql`
    SELECT
      transcriptResources.text AS transcript
    FROM
      ${contentResource},
      JSON_TABLE (
        ${contentResource.resources},
        '$[*]' COLUMNS (
          _type VARCHAR(255) PATH '$._type',
          text TEXT PATH '$.text'
        )
      ) AS transcriptResources
    WHERE
      type = 'videoResource'
      AND transcriptResources._type = 'transcript'
      AND id = ${videoResourceId};
 `
  return db
    .execute(query)
    .then((result) => {
      return (result.rows[0] as { transcript: string | null })?.transcript
    })
    .catch((error) => {
      return error
    })
}

export async function getTranscriptWithScreenshots(videoResourceId: string | null): Promise<string | null> {
  if (!videoResourceId) {
    return null
  }
  const query = sql`
    SELECT
      transcriptWithScreenshots.text AS text
    FROM
      ${contentResource},
      JSON_TABLE (
        ${contentResource.resources},
        '$[*]' COLUMNS (
          _type VARCHAR(255) PATH '$._type',
          text TEXT PATH '$.text'
        )
      ) AS transcriptWithScreenshots
    WHERE
      type = 'videoResource'
      AND transcriptWithScreenshots._type = 'transcriptWithScreenshots'
      AND id = ${videoResourceId};
 `
  return db
    .execute(query)
    .then((result) => {
      console.log(result)
      return (result.rows[0] as { text: string | null })?.text || null
    })
    .catch((error) => {
      console.log(error)
      return error
    })
}
