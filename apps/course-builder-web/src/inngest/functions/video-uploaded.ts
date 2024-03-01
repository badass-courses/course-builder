import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { env } from '@/env.mjs'
import { VIDEO_RESOURCE_CREATED_EVENT } from '@/inngest/events/video-resource'
import { VIDEO_STATUS_CHECK_EVENT } from '@/inngest/events/video-status-check'
import { VIDEO_UPLOADED_EVENT } from '@/inngest/events/video-uploaded'
import { inngest } from '@/inngest/inngest.server'
import { createMuxAsset } from '@/lib/get-mux-options'
import { convertToMigratedResource, getVideoResource } from '@/lib/video-resource'
import { sanityMutation } from '@/server/sanity.server'

export const videoUploaded = inngest.createFunction(
  {
    id: `video-uploaded`,
    name: 'Video Uploaded',
    rateLimit: {
      key: 'event.user.id',
      limit: 5,
      period: '10m',
    },
  },
  { event: VIDEO_UPLOADED_EVENT },
  async ({ event, step }) => {
    if (!event.user.id) {
      throw new Error('No user id for video uploaded event')
    }

    const muxAsset = await step.run('create the mux asset', async () => {
      return createMuxAsset({
        url: event.data.originalMediaUrl,
        passthrough: event.data.resourceId || event.data.fileName,
      })
    })

    const videoResource = await step.run('create the video resource in Sanity', async () => {
      const playbackId = muxAsset.playback_ids.filter((playbackId) => playbackId.policy === 'public')[0]?.id

      await sanityMutation([
        {
          createOrReplace: {
            _id: event.data.fileName,
            _type: 'videoResource',
            originalMediaUrl: event.data.originalMediaUrl,
            title: event.data.fileName,
            muxAssetId: muxAsset.id,
            muxPlaybackId: playbackId,
            state: `processing`,
          },
        },
      ])

      return await getVideoResource(event.data.fileName)
    })

    if (!videoResource) {
      throw new Error('Failed to create video resource')
    }

    await step.run('save video resource to database', async () => {
      const migratedResource = convertToMigratedResource({
        videoResource: videoResource,
        ownerUserId: event.user.id,
      })

      await db.insert(contentResource).values(migratedResource)
      return db.query.contentResource.findFirst({
        where: (cr, { eq }) => eq(cr.id, migratedResource.id),
      })
    })

    // TODO: This is a future feature for modules
    // if (event.data.moduleSlug) {
    //   const newLesson = await step.run('create lesson module for video resource', async () => {
    //     const lessonId = v4()
    //     const titleToUse = event.data.title || event.data.fileName
    //     return await sanityMutation(
    //       [
    //         {
    //           create: {
    //             _id: `lesson-${lessonId}`,
    //             _type: 'module',
    //             title: toChicagoTitleCase(titleToUse.replace(/-/g, ' ').replace(/\.mp4/g, '')),
    //             state: 'draft',
    //             moduleType: 'lesson',
    //             slug: {
    //               _type: 'slug',
    //               current: `lesson-${lessonId}`,
    //             },
    //
    //             resources: [
    //               {
    //                 _type: 'reference' as const,
    //                 _key: v4(),
    //                 _ref: videoResource._id,
    //               },
    //             ],
    //           },
    //         },
    //       ],
    //       { returnDocuments: true },
    //     ).then((res) => res.results[0].document)
    //   })
    //
    //   const parentModule = await step.run('get module', async () => {
    //     return await sanityQuery(`*[_type == "module" && slug.current == "${event.data.moduleSlug}"][0]{_id}`)
    //   })
    //
    //   if (parentModule) {
    //     await step.run('add lesson to module', async () => {
    //       return await sanityMutation(
    //         [
    //           {
    //             patch: {
    //               id: parentModule._id,
    //               setIfMissing: { resources: [] },
    //               insert: {
    //                 before: 'resources[-1]',
    //                 items: [
    //                   {
    //                     _type: 'reference' as const,
    //                     _key: v4(),
    //                     _ref: newLesson._id,
    //                   },
    //                 ],
    //               },
    //             },
    //           },
    //         ],
    //         { returnDocuments: true },
    //       )
    //     })
    //   }
    // }

    await step.run('announce video resource created', async () => {
      await fetch(`${env.NEXT_PUBLIC_PARTY_KIT_URL}/party/${videoResource._id}`, {
        method: 'POST',
        body: JSON.stringify({
          body: videoResource,
          requestId: event.data.fileName,
          name: 'videoResource.created',
        }),
      }).catch((e) => {
        console.error(e)
      })
    })

    await step.sendEvent('order transcript for new video resource', {
      name: VIDEO_RESOURCE_CREATED_EVENT,
      data: {
        moduleSlug: event.data.moduleSlug,
        originalMediaUrl: event.data.originalMediaUrl,
        videoResourceId: videoResource._id,
      },
    })

    if (event.data.fileKey) {
      await step.sendEvent('remove video from uploadthing when done', {
        name: VIDEO_STATUS_CHECK_EVENT,
        data: {
          fileKey: event.data.fileKey,
          videoResourceId: videoResource._id,
        },
      })
    }

    return { data: event.data, videoResource, muxAsset }
  },
)
