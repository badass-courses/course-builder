'use server'

import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { sql } from 'drizzle-orm'

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
			throw error
		})
}
