import {inngest} from '@/inngest/inngest.server'
import {VIDEO_UPLOADED_EVENT} from '@/inngest/events/video-uploaded'
import {sanityMutation, sanityQuery} from '@/server/sanity.server'
import {env} from '@/env.mjs'
import {createMuxAsset} from '@/lib/get-mux-options'
import {orderDeepgramTranscript} from '@/lib/deepgram-order-transcript'
import {toChicagoTitleCase} from '@/utils/chicagor-title'
import {v4} from 'uuid'
import {utapi} from '@/app/api/uploadthing/core'

export const videoUploaded = inngest.createFunction(
  {id: `video-uploaded`, name: 'Video Uploaded'},
  {event: VIDEO_UPLOADED_EVENT},
  async ({event, step}) => {
    const muxAsset = await step.run('create the mux asset', async () => {
      return createMuxAsset({
        url: event.data.originalMediaUrl,
        passthrough: event.data.fileName,
      })
    })

    const videoResource = await step.run(
      'create the video resource in Sanity',
      async () => {
        const playbackId = muxAsset.playback_ids.filter(
          (playbackId) => playbackId.policy === 'public',
        )[0]?.id

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

        return await sanityQuery(
          `*[_type == "videoResource" && _id == "${event.data.fileName}"][0]`,
        )
      },
    )

    const newLesson = await step.run(
      'create lesson module for video resource',
      async () => {
        const lessonId = v4()
        const titleToUse = event.data.title || event.data.fileName
        return await sanityMutation(
          [
            {
              create: {
                _id: `lesson-${lessonId}`,
                _type: 'module',
                title: toChicagoTitleCase(
                  titleToUse.replace(/-/g, ' ').replace(/\.mp4/g, ''),
                ),
                state: 'draft',
                moduleType: 'lesson',
                slug: {
                  _type: 'slug',
                  current: `lesson-${lessonId}`,
                },

                resources: [
                  {
                    _type: 'reference' as const,
                    _key: v4(),
                    _ref: videoResource._id,
                  },
                ],
              },
            },
          ],
          {returnDocuments: true},
        ).then((res) => res.results[0].document)
      },
    )

    if (event.data.moduleSlug) {
      const parentModule = await step.run('get module', async () => {
        return await sanityQuery(
          `*[_type == "module" && slug.current == "${event.data.moduleSlug}"][0]{_id}`,
        )
      })

      if (parentModule) {
        await step.run('add lesson to module', async () => {
          return await sanityMutation(
            [
              {
                patch: {
                  id: parentModule._id,
                  setIfMissing: {resources: []},
                  insert: {
                    before: 'resources[-1]',
                    items: [
                      {
                        _type: 'reference' as const,
                        _key: v4(),
                        _ref: newLesson._id,
                      },
                    ],
                  },
                },
              },
            ],
            {returnDocuments: true},
          )
        })
      }
    }

    await step.run('announce video resource created', async () => {
      await fetch(
        `${env.NEXT_PUBLIC_PARTY_KIT_URL}/party/${env.NEXT_PUBLIC_PARTYKIT_ROOM_NAME}`,
        {
          method: 'POST',
          body: JSON.stringify({
            body: `Video Resource Created: ${event.data.fileName}`,
            requestId: event.data.fileName,
            name: 'videoResource.created',
          }),
        },
      ).catch((e) => {
        console.error(e)
      })
    })

    const deepgram = await step.run('Order Transcript [Deepgram]', async () => {
      return await orderDeepgramTranscript({
        moduleSlug: event.data.moduleSlug,
        mediaUrl: event.data.originalMediaUrl,
        videoResourceId: event.data.fileName,
      })
    })

    if (event.data.fileKey) {
      await step.run('delete file from uploadthing', async () => {
        return utapi.deleteFiles(event.data.fileKey as string)
      })
    }

    return {data: event.data, videoResource, muxAsset, deepgram}
  },
)
