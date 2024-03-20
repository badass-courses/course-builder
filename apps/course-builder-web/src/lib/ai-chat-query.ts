'use server'

import { getAbility } from '@/ability'
import { db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import { RESOURCE_CHAT_REQUEST_EVENT } from '@/inngest/events/resource-chat-request'
import { inngest } from '@/inngest/inngest.server'
import { ChatResourceSchema } from '@/lib/ai-chat'
import { getServerAuthSession } from '@/server/auth'
import { sql } from 'drizzle-orm'
import { z } from 'zod'

export async function sendResourceChatMessage({
  resourceId,
  messages,
  selectedWorkflow,
}: {
  resourceId: string
  messages: any[]
  selectedWorkflow?: string
}) {
  const session = await getServerAuthSession()
  const user = session?.user
  const ability = getAbility({ user })
  if (!user || !ability.can('create', 'Content')) {
    throw new Error('Unauthorized')
  }

  await inngest.send({
    name: RESOURCE_CHAT_REQUEST_EVENT,
    data: {
      resourceId,
      messages,
      selectedWorkflow: selectedWorkflow || 'article/chat-event',
    },
    user,
  })
}

export async function getChatResource(id: string) {
  const query = sql`
    SELECT
      resources.id as _id,
      resources.type as _type,
      resources.fields,
      CAST(resources.updatedAt AS DATETIME) as _updatedAt,
      CAST(resources.createdAt AS DATETIME) as _createdAt,
      JSON_EXTRACT (resources.fields, "$.title") AS title,
      JSON_EXTRACT (resources.fields, "$.body") AS body,
      JSON_EXTRACT (videoResources.fields, "$.transcript") AS transcript,
      JSON_EXTRACT (videoResources.fields, "$.wordLevelSrt") AS wordLevelSrt
    FROM
      ${contentResource} as resources
    -- join assumes that there is a single video resource ie a Tip
    LEFT JOIN (
      SELECT
        refs.resourceOfId,
        videoResources.fields
      FROM
        ${contentResourceResource} as refs
      JOIN ${contentResource} as videoResources
        ON refs.resourceId = videoResources.id AND videoResources.type = 'videoResource'
    ) as videoResources
      ON resources.id = videoResources.resourceOfId 
    WHERE
      resources.id = ${id};
  `

  return db
    .execute(query)
    .then((result) => {
      const parsed = ChatResourceSchema.safeParse(result.rows[0])
      return parsed.success ? parsed.data : null
    })
    .catch((error) => {
      console.error(error)
      throw error
    })
}
