import { db } from '@/db'
import { contentResource, contentResourceResource, users } from '@/db/schema'
import { inngest } from '@/inngest/inngest.server'
import { convertToMigratedArticleResource, type Article } from '@/lib/articles'
import { convertToMigratedTipResource, type Tip } from '@/lib/tips'
import { convertToMigratedVideoResource, type VideoResource } from '@/lib/video-resource'
import { sanityQuery } from '@/server/sanity.server'
import { eq, or } from 'drizzle-orm'

async function fetchContentResource(id: string) {
  const results = await db
    .select()
    .from(contentResource)
    .where(or(eq(contentResource.id, id), eq(contentResource.id, id)))
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
          ...,
          "slug": slug.current
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
          console.log('migrating article', sanityArticleResource._id)
          const migratedResource = convertToMigratedArticleResource({
            article: sanityArticleResource,
            ownerUserId: migrationResourceOwner.id,
          })

          return db.insert(contentResource).values(migratedResource).execute()
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
            console.log('migrating video', sanityVideoResource._id)

            const migratedResource = convertToMigratedVideoResource({
              videoResource: sanityVideoResource,
              ownerUserId: migrationResourceOwner.id,
            })

            console.log('inserting video', sanityVideoResource._id)

            await db.insert(contentResource).values(migratedResource).execute()

            console.log('inserted video', sanityVideoResource._id)
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
            ...,
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
        const tipResources = await step.run('insert tip resource into the database', async () => {
          console.log('migrating tip', sanityTip._id)

          const migratedResource = convertToMigratedTipResource({
            tip: sanityTip,
            ownerUserId: migrationResourceOwner.id,
          })

          console.log('inserting tip', sanityTip._id)

          const { resources, ...migratedResourceWithoutResources } = migratedResource

          await db.insert(contentResource).values(migratedResourceWithoutResources).execute()

          return resources
        })

        for (const resource of tipResources) {
          await step.run('insert tip video resource relation into the database', async () => {
            await db
              .insert(contentResourceResource)
              .values({
                resourceOfId: sanityTip._id,
                resourceId: resource.id,
                position: 0,
              })
              .execute()
          })
        }
      }
    }

    return {
      success: true,
    }
  },
)
