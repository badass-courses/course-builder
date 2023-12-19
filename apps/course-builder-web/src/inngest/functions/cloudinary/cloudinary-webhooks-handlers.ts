import {inngest} from '@/inngest/inngest.server'
import {MUX_WEBHOOK_EVENT} from '@/inngest/events/mux-webhook'
import {env} from '@/env.mjs'
import {sanityMutation, sanityQuery} from '@/server/sanity.server'
import {CLOUDINARY_WEBHOOK_EVENT} from '@/inngest/events/cloudinary-webhook'

export const cloudinaryAssetCreated = inngest.createFunction(
  {id: `cloudinary-asset-created`, name: 'Cloudinary Asset Created'},
  {
    event: CLOUDINARY_WEBHOOK_EVENT,
    if: 'event.data.notification_type == "upload"',
  },
  async ({event, step}) => {
    const imageResource = await step.run(
      'create the video resource in Sanity',
      async () => {
        await sanityMutation([
          {
            createOrReplace: {
              _id: event.data.asset_id,
              _type: 'imageResource',
              url: event.data.secure_url,
            },
          },
        ])

        return await sanityQuery(
          `*[_type == "imageResource" && _id == "${event.data.asset_id}"][0]`,
        )
      },
    )

    await step.run('announce asset created', async () => {
      await fetch(
        `${env.NEXT_PUBLIC_PARTY_KIT_URL}/party/${env.NEXT_PUBLIC_PARTYKIT_ROOM_NAME}`,
        {
          method: 'POST',
          body: JSON.stringify({
            body: event.data,
            requestId: event.data.public_id,
            name: 'cloudinary.asset.created',
          }),
        },
      ).catch((e) => {
        console.error(e)
      })
    })

    return imageResource
  },
)

// TODO: Assign to Sanity Module Resources[]
