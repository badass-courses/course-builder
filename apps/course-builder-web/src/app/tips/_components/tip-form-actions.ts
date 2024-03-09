'use server'

import { getAbility } from '@/ability'
import { OCR_WEBHOOK_EVENT } from '@/inngest/events/ocr-webhook'
import { inngest } from '@/inngest/inngest.server'
import { getServerAuthSession } from '@/server/auth'

export async function requestCodeExtraction(options: { imageUrl?: string; resourceId?: string }) {
  const session = await getServerAuthSession()
  const ability = getAbility({ user: session?.user })
  const user = session?.user

  if (!options.imageUrl) {
    throw new Error('Image URL is required')
  }

  if (!user || !ability.can('create', 'Content')) {
    throw new Error('Unauthorized')
  }

  await inngest.send({
    name: OCR_WEBHOOK_EVENT,
    data: {
      ocrWebhookEvent: {
        screenshotUrl: options.imageUrl,
        resourceId: options.resourceId,
      },
    },
    user,
  })
}
