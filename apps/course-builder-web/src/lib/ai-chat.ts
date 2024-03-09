'use server'

import { RESOURCE_CHAT_REQUEST_EVENT } from '@/inngest/events'
import { inngest } from '@/inngest/inngest.server'
import { getAbility } from '@/lib/ability'
import { getServerAuthSession } from '@/server/auth'

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
