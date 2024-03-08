'use server'

import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { VideoResource, VideoResourceSchema } from '@/lib/video-resource'
import { sql } from 'drizzle-orm'

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
      console.log('📼 transcriptWithScreenshots', result.rows[0], videoResourceId)
      return (result.rows[0] as { text: string | null })?.text || null
    })
    .catch((error) => {
      console.log(error)
      return error
    })
}

export async function getVideoResource(videoResourceId?: string | null): Promise<VideoResource | null> {
  console.log('📼 getVideoResource', videoResourceId)
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
      console.log('\t result', result)
      const parsedResource = VideoResourceSchema.safeParse(result.rows[0])
      return parsedResource.success ? parsedResource.data : null
    })
    .catch((error) => {
      console.error(error)
      return error
    })
}

export async function getVideoResourceByMuxAssetId(muxAssetId?: string | null): Promise<VideoResource | null> {
  console.log('📼 getVideoResourceByMuxAssetId', muxAssetId)
  if (!muxAssetId) {
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
      AND JSON_EXTRACT (${contentResource.fields}, "$.muxAssetId") = ${muxAssetId};
      
 `
  return db
    .execute(query)
    .then((result) => {
      console.log('\t result', result)
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
