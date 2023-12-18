import {type NextRequest, NextResponse} from 'next/server'
import {inngest} from '@/inngest/inngest.server'
import {
  CLOUDINARY_WEBHOOK_EVENT,
  CloudinaryWebhookEventSchema,
} from '@/inngest/events/cloudinary-webhook'
import {withSkill} from '@/server/with-skill'

export const POST = withSkill(async (req: NextRequest) => {
  // todo: check secret to verify the request
  const cloudinaryWebhookEvent = CloudinaryWebhookEventSchema.parse(
    await req.json(),
  )

  console.info(
    `Received from cloudinary: ${cloudinaryWebhookEvent.notification_type} [${cloudinaryWebhookEvent.asset_id}]}]`,
  )

  await inngest.send({
    name: CLOUDINARY_WEBHOOK_EVENT,
    data: cloudinaryWebhookEvent,
  })

  return new Response('ok', {
    status: 200,
  })
})
