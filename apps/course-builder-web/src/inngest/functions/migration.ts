import { inngest } from '@/inngest/inngest.server'
import { Article } from '@/lib/articles'
import { Tip } from '@/lib/tips'
import { VideoResource } from '@/lib/video-resource'
import { db } from '@/server/db'
import { contentResource, users } from '@/server/db/schema'
import { sanityQuery } from '@/server/sanity.server'
import slugify from '@sindresorhus/slugify'
import { eq, or } from 'drizzle-orm'
import { customAlphabet } from 'nanoid'
import { z } from 'zod'

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 5)

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
        await step.run('insert article resources into the database', async () => {
          const MigratedArticleResourceSchema = z.object({
            createdById: z.string(),
            title: z.string(),
            type: z.string(),
            slug: z.string(),
            body: z.string().nullable(),
            id: z.string(),
            metadata: z
              .object({
                state: z.string(),
                visibility: z.string(),
                description: z.string().optional().nullable(),
                socialImage: z.object({ type: z.string(), url: z.string() }).optional().nullable(),
              })
              .default({ state: 'draft', visibility: 'unlisted', description: null, socialImage: null }),
          })

          const migratedResource = MigratedArticleResourceSchema.parse({
            createdById: migrationResourceOwner.id,
            title: sanityArticleResource.title || 'Untitled Article',
            type: 'article',
            slug: sanityArticleResource.slug,
            body: sanityArticleResource.body,
            id: sanityArticleResource._id,
            metadata: {
              state: sanityArticleResource.state,
              visibility: sanityArticleResource.visibility,
              ...(sanityArticleResource.description ? { description: sanityArticleResource.description } : null),
              ...(sanityArticleResource.socialImage
                ? {
                    socialImage: {
                      type: 'imageUrl',
                      url: sanityArticleResource.socialImage,
                    },
                  }
                : null),
            },
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
        await step.run('insert video resources into the database', async () => {
          const MigratedVideoResourceSchema = z.object({
            createdById: z.string(),
            title: z.string(),
            type: z.string(),
            slug: z.string(),
            body: z.string().nullable(),
            id: z.string(),
            metadata: z.object({
              state: z.string(),
              muxPlaybackId: z.string(),
              muxAssetId: z.string(),
              duration: z.number().optional(),
              transcript: z.string().optional().nullable(),
              transcriptWithScreenshots: z.string().optional().nullable(),
              srt: z.string().optional().nullable(),
              wordLevelSrt: z.string().optional().nullable(),
            }),
          })

          const migratedResource = MigratedVideoResourceSchema.parse({
            createdById: migrationResourceOwner.id,
            title: sanityVideoResource.title || 'Untitled Video',
            type: 'videoResource',
            slug: slugify(sanityVideoResource.title || `untitled-video-${nanoid()}`),
            body: null,
            id: sanityVideoResource._id,
            metadata: {
              state: sanityVideoResource.state,
              muxPlaybackId: sanityVideoResource.muxPlaybackId,
              muxAssetId: sanityVideoResource.muxAssetId,
              ...(sanityVideoResource.duration ? { duration: sanityVideoResource.duration } : null),
              ...(sanityVideoResource.transcript ? { transcript: sanityVideoResource.transcript } : null),
              ...(sanityVideoResource.transcriptWithScreenshots
                ? { transcriptWithScreenshots: sanityVideoResource.transcriptWithScreenshots }
                : null),
              ...(sanityVideoResource.srt ? { srt: sanityVideoResource.srt } : null),
              ...(sanityVideoResource.wordLevelSrt ? { wordLevelSrt: sanityVideoResource.wordLevelSrt } : null),
            },
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
        await step.run('insert tip resource into the database', async () => {
          const MigratedTipResourceSchema = z.object({
            createdById: z.string(),
            title: z.string(),
            type: z.string(),
            slug: z.string(),
            body: z.string().nullable(),
            id: z.string(),
            updatedAt: z.date(),
            resources: z.array(z.object({ type: z.string(), _ref: z.string() })).default([]),
            metadata: z
              .object({ state: z.string(), visibility: z.string(), summary: z.string().nullable() })
              .default({ state: 'draft', visibility: 'unlisted', summary: '' }),
          })

          const migratedResource = MigratedTipResourceSchema.parse({
            createdById: migrationResourceOwner.id,
            title: sanityTip.title || 'Untitled Tip',
            type: sanityTip._type,
            slug: sanityTip.slug,
            body: sanityTip.body,
            id: sanityTip._id,
            updatedAt: new Date(sanityTip._updatedAt),
            resources: [
              {
                type: `_ref`,
                _ref: sanityTip.videoResourceId,
              },
            ],
            metadata: {
              state: sanityTip.state,
              visibility: sanityTip.visibility,
              ...(sanityTip.summary && { summary: sanityTip.summary }),
            },
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
