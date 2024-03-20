import { type NextRequest } from 'next/server'
import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { sql } from 'drizzle-orm'

export const GET = async (_: NextRequest, { params }: { params: { videoResourceId: string } }) => {
  const query = sql`
    SELECT
    JSON_EXTRACT (${contentResource.fields}, "$.srt") AS srt
    FROM
      ${contentResource}
    WHERE
      type = 'videoResource'
      AND id = ${params.videoResourceId};
   `

  const result = await db
    .execute(query)
    .then((result) => {
      console.log(result)
      return (result.rows[0] as { srt: string | null })?.srt || null
    })
    .catch((error) => {
      console.log(error)
      return error
    })
  return new Response(result || '', {
    status: 200,
  })
}
