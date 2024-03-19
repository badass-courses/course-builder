import { inngest } from '../../inngest.server'
import { VIDEO_SRT_READY_EVENT, VIDEO_TRANSCRIPT_READY_EVENT } from '../events'

export const transcriptReady = inngest.createFunction(
  { id: `transcript-ready-event`, name: 'Transcript Ready' },
  {
    event: VIDEO_TRANSCRIPT_READY_EVENT,
  },
  async ({ event, step, partyKitRootUrl, db }) => {
    const videoResourceId = event.data.videoResourceId
    if (!videoResourceId) {
      throw new Error('video resource id is required')
    }

    const transcript = event.data.transcript
    const srt = event.data.srt
    const wordLevelSrt = event.data.wordLevelSrt

    await step.run('update the video resource in the database', async () => {
      db.updateContentResourceFields({
        id: videoResourceId,
        fields: {
          transcript,
          srt,
          wordLevelSrt,
        },
      })
    })

    if (srt && wordLevelSrt && videoResourceId) {
      await step.sendEvent('announce that srt is ready', {
        name: VIDEO_SRT_READY_EVENT,
        data: {
          videoResourceId: videoResourceId,
          moduleSlug: event.data.moduleSlug,
          srt,
          wordLevelSrt,
        },
      })
    }

    await step.run('send the transcript to the party', async () => {
      await fetch(`${partyKitRootUrl}/party/${videoResourceId}`, {
        method: 'POST',
        body: JSON.stringify({
          body: transcript,
          requestId: videoResourceId,
          name: 'transcript.ready',
        }),
      }).catch((e) => {
        console.error(e)
      })
    })

    return { srt, wordLevelSrt, transcript }
  },
)
