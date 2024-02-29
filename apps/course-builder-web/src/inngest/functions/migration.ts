import { inngest } from '@/inngest/inngest.server'
import { Article, convertToMigratedArticleResource } from '@/lib/articles'
import { convertToMigratedTipResource, MigratedTipResourceSchema, Tip } from '@/lib/tips'
import { convertToMigratedResource, MigratedVideoResourceSchema, VideoResource } from '@/lib/video-resource'
import { db } from '@/server/db'
import { contentResource, users } from '@/server/db/schema'
import { sanityQuery } from '@/server/sanity.server'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'
import { eq, or } from 'drizzle-orm'
import { customAlphabet } from 'nanoid'
import { z } from 'zod'

async function fetchContentResource(slugOrId: string) {
  const results = await db
    .select()
    .from(contentResource)
    .where(or(eq(contentResource.slug, slugOrId), eq(contentResource.id, slugOrId)))
    .execute()

  return results[0] || null
}

export const migrationFromSanity = inngest.createFunction(
  {
    id: `migration`,
    name: 'migrate stuff from sanity',
  },
  {
    event: 'migration',
  },
  async ({ event, step }) => {
    const migrationResourceOwner = await step.run('load migration user', async () => {
      const result = await db.select().from(users).where(eq(users.email, 'joelhooks@gmail.com'))

      return result[0] || null
    })

    const sanityArticleResources = await step.run('fetch video resources from sanity', async () => {
      return await sanityQuery<Article[]>(
        `*[_type == "article"]{
          _id,
          _type,
          _updatedAt,
          title,
          description,
          body,
          visibility,
          "slug": slug.current,
          state,
          socialImage,
      }`,
        { cache: 'no-cache' },
      )
    })

    for (const sanityArticleResource of sanityArticleResources) {
      const canMigrateArticleResource = await step.run('check if article can be migrated', async () => {
        const existingResource = await fetchContentResource(sanityArticleResource._id)

        return !existingResource
      })

      if (canMigrateArticleResource && migrationResourceOwner) {
        step.run('insert article resources into the database', async () => {
          const migratedResource = convertToMigratedArticleResource({
            article: sanityArticleResource,
            ownerUserId: migrationResourceOwner.id,
          })

          console.log('migrating article', sanityArticleResource._id)

          return db.insert(contentResource).values(migratedResource)
        })
      }
    }

    const sanityVideoResources = await step.run('fetch video resources from sanity', async () => {
      return await sanityQuery<VideoResource[]>(`*[_type == "videoResource"]`, { cache: 'no-cache' })
    })

    for (const sanityVideoResource of sanityVideoResources) {
      const canMigrateVideoResource = await step.run('check if video can be migrated', async () => {
        const existingResource = await fetchContentResource(sanityVideoResource._id)

        return !existingResource
      })

      if (canMigrateVideoResource && migrationResourceOwner) {
        step.run('insert video resources into the database', async () => {
          const migratedResource = convertToMigratedResource({
            videoResource: sanityVideoResource,
            ownerUserId: migrationResourceOwner.id,
          })

          console.log('migrating video', sanityVideoResource._id)

          return db.insert(contentResource).values(migratedResource)
        })
      }
    }

    const sanityTipResources = await step.run('fetch tip from sanity', async () => {
      return await sanityQuery<Tip[]>(
        `coalesce(
          *[_type == 'tip'] | order(_updatedAt desc) {
            _id,
            _type,
            _updatedAt,
            title,
            summary,
            visibility,
            state,
            body,
            "muxPlaybackId": resources[@->._type == 'videoResource'][0]->muxPlaybackId,
            "videoResourceId": resources[@->._type == 'videoResource'][0]->_id,
            "transcript": resources[@->._type == 'videoResource'][0]->transcript,
            "slug": slug.current,
      }, [])`,
        { cache: 'no-cache' },
      ).catch((error) => {
        console.error('Error fetching tips module', error)
        return []
      })
    })

    for (const sanityTip of sanityTipResources) {
      const canMigrateTip = await step.run('check if tip can be migrated', async () => {
        const existingResource = await fetchContentResource(sanityTip._id)
        return !existingResource
      })
      if (canMigrateTip && migrationResourceOwner) {
        step.run('insert tip resource into the database', async () => {
          const migratedResource = convertToMigratedTipResource({
            tip: sanityTip,
            ownerUserId: migrationResourceOwner.id,
          })

          console.log('migrating tip', sanityTip._id)

          return db.insert(contentResource).values(migratedResource)
        })
      }
    }

    return {
      success: true,
    }
  },
)
