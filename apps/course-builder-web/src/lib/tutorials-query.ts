'use server'

import { db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import { and, eq, like } from 'drizzle-orm'
import { last } from 'lodash'

import { ContentResource } from '@coursebuilder/core/types'

export const addResourceToTutorial = async ({
  resource,
  tutorialId,
}: {
  resource: ContentResource
  tutorialId: string
}) => {
  const tutorial = await db.query.contentResource.findFirst({
    where: like(contentResource.id, `%${last(tutorialId.split('-'))}%`),
    with: {
      resources: true,
    },
  })

  if (!tutorial) {
    throw new Error(`Tutorial with id ${tutorialId} not found`)
  }
  console.log('resource', resource)

  const result = await db.insert(contentResourceResource).values({
    resourceOfId: tutorialId,
    resourceId: resource.id,
    position: tutorial.resources.length,
  })

  console.log(result)

  return result
}

export const updateResourcePosition = async ({
  tutorialId,
  resourceId,
  position,
}: {
  tutorialId: string
  resourceId: string
  position: number
}) => {
  console.log('updateResourcePosition', { tutorialId, resourceId, position })
  const result = await db
    .update(contentResourceResource)
    .set({ position })
    .where(
      and(
        like(
          contentResourceResource.resourceOfId,
          `%${last(tutorialId.split('-'))}%`,
        ),
        eq(contentResourceResource.resourceId, resourceId),
      ),
    )

  console.log(result)
  return result
}
