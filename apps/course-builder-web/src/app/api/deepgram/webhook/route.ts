import { type NextResponse } from 'next/server'
import { inngest } from '@/inngest/inngest.server'
import { VIDEO_TRANSCRIPT_READY_EVENT } from '@/inngest/video-processing/events/video-transcript-ready'
import { transcriptProvider } from '@/providers/deepgram'
import { withSkill, type SkillRequest } from '@/server/with-skill'

export const POST = withSkill(async (req: SkillRequest, res: NextResponse) => {
  // todo: check MUX_WEBHOOK_SIGNING_SECRET to verify the request

  const url = new URL(req.url)
  const videoResourceId = url.searchParams.get('videoResourceId')
  const moduleSlug = url.searchParams.get('moduleSlug')
  const { results }: { results: any } = await req.json()

  if (!results) {
    return new Response(`Bad request`, { status: 400 })
  }

  req.log.info(`Received transcript from deepgram for videoResource [${videoResourceId}]: ${results.id}`)

  const { srt, wordLevelSrt, transcript } = transcriptProvider.handleCallback(results)

  await inngest.send({
    name: VIDEO_TRANSCRIPT_READY_EVENT,
    data: {
      videoResourceId,
      moduleSlug,
      results,
      srt,
      wordLevelSrt,
      transcript,
    },
  })

  return new Response('ok', {
    status: 200,
  })
})
