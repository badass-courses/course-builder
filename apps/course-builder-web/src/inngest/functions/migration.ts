import { db } from '@/db'
import { contentResource, users } from '@/db/schema'
import { inngest } from '@/inngest/inngest.server'
import { convertToMigratedArticleResource, type Article } from '@/lib/articles'
import { convertToMigratedTipResource, type Tip } from '@/lib/tips'
import { convertToMigratedVideoResource, type VideoResource } from '@/lib/video-resource'
import { sanityQuery } from '@/server/sanity.server'
import { eq, or } from 'drizzle-orm'

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
    concurrency: 10,
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

    const allArticleResourcesIds = await step.run('fetch article resources from the database', async () => {
      return await db
        .select({ id: contentResource.id })
        .from(contentResource)
        .where(eq(contentResource.type, 'article'))
        .execute()
        .then((results) => results.map((result) => result.id))
    })

    for (const sanityArticleResource of sanityArticleResources) {
      if (!allArticleResourcesIds.includes(sanityArticleResource._id) && migrationResourceOwner) {
        await step.run('insert article resources into the database', async () => {
          const migratedResource = convertToMigratedArticleResource({
            article: sanityArticleResource,
            ownerUserId: migrationResourceOwner.id,
          })

          console.log('migrating article', sanityArticleResource._id)

          db.insert(contentResource).values(migratedResource).execute()
        })
      }
    }

    const sanityVideoResources = await step.run('fetch video resources from sanity', async () => {
      return await sanityQuery<VideoResource[]>(`*[_type == "videoResource"]`, { cache: 'no-cache' })
    })

    const allVideoResourcesIds = await step.run('fetch video resources from the database', async () => {
      return await db
        .select({ id: contentResource.id })
        .from(contentResource)
        .where(eq(contentResource.type, 'videoResource'))
        .execute()
        .then((results) => results.map((result) => result.id))
    })

    for (const sanityVideoResource of sanityVideoResources) {
      if (!allVideoResourcesIds.includes(sanityVideoResource._id) && migrationResourceOwner) {
        await step.run('insert video resources into the database', async () => {
          try {
            const migratedResource = convertToMigratedVideoResource({
              videoResource: sanityVideoResource,
              ownerUserId: migrationResourceOwner.id,
            })

            console.log('migrating video', sanityVideoResource._id)

            db.insert(contentResource).values(migratedResource).execute()
          } catch (error) {
            console.error('Error migrating video', error)
          }
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

    const allTipResourcesIds = await step.run('fetch tip resources from the database', async () => {
      return await db
        .select({ id: contentResource.id })
        .from(contentResource)
        .where(eq(contentResource.type, 'tip'))
        .execute()
        .then((results) => results.map((result) => result.id))
    })

    for (const sanityTip of sanityTipResources) {
      if (!sanityTip) {
        continue
      }

      if (!allTipResourcesIds.includes(sanityTip._id) && migrationResourceOwner) {
        await step.run('insert tip resource into the database', async () => {
          const migratedResource = convertToMigratedTipResource({
            tip: sanityTip,
            ownerUserId: migrationResourceOwner.id,
          })

          console.log('migrating tip', sanityTip._id)

          db.insert(contentResource).values(migratedResource).execute()
        })
      }
    }

    return {
      success: true,
    }
  },
)
