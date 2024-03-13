'use server'

import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { VideoResource, VideoResourceSchema } from '@/lib/video-resource'
import { ExecutedQuery } from '@planetscale/database'
import { sql } from 'drizzle-orm'

export async function updateVideoStatus({
  videoResourceId,
  status,
}: {
  videoResourceId: string
  status: string
}): Promise<ExecutedQuery<any[] | Record<string, any>>> {
  const query = sql`
        UPDATE ${contentResource}
        SET
          ${contentResource.fields} = JSON_SET(
            ${contentResource.fields}, 
            '$.state', ${status}
          )
        WHERE
          id = ${videoResourceId};
      `
  return db
    .execute(query)
    .then((result) => {
      console.log('📼 updated video resource status', result)
      return result
    })
    .catch((error) => {
      console.error(error)
      throw error
    })
}

export async function updateVideoWithTranscripts({
  videoResourceId,
  transcript,
  srt,
  wordLevelSrt,
}: {
  videoResourceId: string
  transcript: string
  srt: string
  wordLevelSrt: string
}): Promise<ExecutedQuery<any[] | Record<string, any>>> {
  const query = sql`
        UPDATE ${contentResource}
        SET
          ${contentResource.fields} = JSON_SET(
            ${contentResource.fields}, 
            '$.transcript', ${transcript}, 
            '$.srt', ${srt}, 
            '$.wordLevelSrt', ${wordLevelSrt}, 
            '$.state', 'ready'
          )
        WHERE
          id = ${videoResourceId};
      `
  return db
    .execute(query)
    .then((result) => {
      console.log('📼 updated video resource', result)
      return result
    })
    .catch((error) => {
      console.error(error)
      throw error
    })
}

export async function getTranscriptWithScreenshots(videoResourceId?: string | null): Promise<string | null> {
  if (!videoResourceId) {
    return null
  }
  const query = sql`
    SELECT
    JSON_EXTRACT (${contentResource.fields}, "$.transcriptWithScreenshots") AS text
    FROM
      ${contentResource}
    WHERE
      type = 'videoResource'
      AND id = ${videoResourceId};
 `
  return db
    .execute(query)
    .then((result) => {
      return (result.rows[0] as { text: string | null })?.text || null
    })
    .catch((error) => {
      console.log(error)
      return error
    })
}

export async function getVideoResource(videoResourceId?: string | null): Promise<VideoResource | null> {
  if (!videoResourceId) {
    return null
  }
  const query = sql`
    SELECT
      id as _id,
      CAST(updatedAt AS DATETIME) as _updatedAt,
      CAST(createdAt AS DATETIME) as _createdAt,
      JSON_EXTRACT (${contentResource.fields}, "$.state") AS state,
      JSON_EXTRACT (${contentResource.fields}, "$.duration") AS duration,
      JSON_EXTRACT (${contentResource.fields}, "$.muxPlaybackId") AS muxPlaybackId,
      JSON_EXTRACT (${contentResource.fields}, "$.muxAssetId") AS muxAssetId,
      JSON_EXTRACT (${contentResource.fields}, "$.transcript") AS transcript
    FROM
      ${contentResource}
    WHERE
      type = 'videoResource'
      AND (id = ${videoResourceId});
      
 `
  return db
    .execute(query)
    .then((result) => {
      const parsedResource = VideoResourceSchema.safeParse(result.rows[0])
      return parsedResource.success ? parsedResource.data : null
    })
    .catch((error) => {
      console.error(error)
      return error
    })
}

export async function getTranscript(videoResourceId?: string | null) {
  if (!videoResourceId) {
    return null
  }
  const query = sql`
    SELECT
      JSON_EXTRACT (${contentResource.fields}, "$.transcript") AS transcript
    FROM
      ${contentResource}
    WHERE
      type = 'videoResource'
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

export async function createVideoResource(values: {
  id: string
  type: 'videoResource'
  fields: {
    state: 'processing'
    originalMediaUrl: string
    muxAssetId: string
    muxPlaybackId: string
  }
  createdById: string
}): Promise<ExecutedQuery<any[] | Record<string, any>>> {
  return await db
    .insert(contentResource)
    .values(values)
    .then((result) => {
      console.log('📼 created video resource', result)
      return result
    })
    .catch((error) => {
      console.error(error)
      throw error
    })
}

export async function updateVideoTranscriptWithScreenshots({
  videoResourceId,
  transcriptWithScreenshots,
}: {
  videoResourceId: string
  transcriptWithScreenshots: string
}) {
  const query = sql`
        UPDATE ${contentResource}
        SET
          ${contentResource.fields} = JSON_SET(
            ${contentResource.fields}, '$.transcriptWithScreenshots', ${transcriptWithScreenshots})
        WHERE
          id = ${videoResourceId};
      `
  return db
    .execute(query)
    .then((result) => {
      console.log('📼 updated video resource', result)
      return result
    })
    .catch((error) => {
      console.error(error)
      throw error
    })
}
