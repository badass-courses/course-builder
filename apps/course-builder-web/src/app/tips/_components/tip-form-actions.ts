'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { OCR_WEBHOOK_EVENT } from '@/inngest/events/ocr-webhook'
import { inngest } from '@/inngest/inngest.server'
import { getAbility } from '@/lib/ability'
import { convertToMigratedTipResource, type NewTip, type TipUpdate } from '@/lib/tips'
import { getTip } from '@/lib/tips-query'
import { getServerAuthSession } from '@/server/auth'
import { sanityMutation } from '@/server/sanity.server'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'
import { eq } from 'drizzle-orm'
import { v4 } from 'uuid'

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

export async function createTip(input: NewTip) {
  const session = await getServerAuthSession()
  const ability = getAbility({ user: session?.user })
  const user = session?.user

  if (!user || !ability.can('create', 'Content')) {
    throw new Error('Unauthorized')
  }

  const newTipId = v4()

  await sanityMutation([
    {
      createOrReplace: {
        _id: newTipId,
        _type: 'tip',
        title: input.title,
        state: 'draft',
        visibility: 'unlisted',
        slug: {
          current: slugify(`${input.title}~${guid()}`),
        },
        resources: [
          {
            _key: v4(),
            _type: 'reference',
            _ref: input.videoResourceId,
          },
        ],
      },
    },
  ])

  const tip = await getTip(newTipId)

  if (tip) {
    await db.insert(contentResource).values(convertToMigratedTipResource({ tip, ownerUserId: user.id }))
  }

  revalidateTag('tips')

  return tip
}

export async function updateTip(input: TipUpdate) {
  const session = await getServerAuthSession()
  const user = session?.user
  const ability = getAbility({ user })
  if (!user || !ability.can('update', 'Content')) {
    throw new Error('Unauthorized')
  }

  const currentTip = await getTip(input._id)

  if (!currentTip) {
    throw new Error('Not found')
  }

  if (input.title !== currentTip.title) {
    const splitSlug = currentTip?.slug.split('~') || ['', guid()]
    const newSlug = `${slugify(input.title)}~${splitSlug[1] || guid()}`

    await sanityMutation([
      {
        patch: {
          id: input._id,
          set: {
            body: input.body,
            slug: {
              current: newSlug,
            },
            title: input.title,
          },
        },
      },
    ])
  } else {
    await sanityMutation([
      {
        patch: {
          id: input._id,
          set: {
            body: input.body,
          },
        },
      },
    ])
  }

  revalidateTag('tips')
  revalidateTag(input._id)

  const updatedTip = await getTip(input._id)

  if (updatedTip) {
    revalidateTag(updatedTip.slug)
    revalidatePath(`/tips/${updatedTip.slug}`)
    await db
      .update(contentResource)
      .set(convertToMigratedTipResource({ tip: updatedTip, ownerUserId: user.id }))
      .where(eq(contentResource.id, updatedTip._id))
  }

  return updatedTip
}
