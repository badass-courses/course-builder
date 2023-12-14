import {type NextResponse} from 'next/server'
import {inngest} from '@/inngest/inngest.server'
import {
  srtFromTranscriptResult,
  transcriptAsParagraphsWithTimestamps,
} from '@/lib/deepgram-results-processor'
import {TRANSCRIPT_READY_EVENT} from '@/inngest/events/transcript-requested'
import {type SkillRequest, withSkill} from '@/server/with-skill'

export const POST = withSkill(async (req: SkillRequest, res: NextResponse) => {
  // todo: check MUX_WEBHOOK_SIGNING_SECRET to verify the request

  const url = new URL(req.url)
  const videoResourceId = url.searchParams.get('videoResourceId')
  const moduleSlug = url.searchParams.get('moduleSlug')
  const {results}: {results: any} = await req.json()

  if (!results) {
    return new Response(`Bad request`, {status: 400})
  }

  req.log.info(
    `Received transcript from deepgram for videoResource [${videoResourceId}]: ${results.id}`,
  )

  const srt = srtFromTranscriptResult(results)
  const transcript = transcriptAsParagraphsWithTimestamps(results)

  await inngest.send({
    name: TRANSCRIPT_READY_EVENT,
    data: {
      videoResourceId,
      moduleSlug,
      srt,
      transcript,
    },
  })

  return new Response('ok', {
    status: 200,
  })
})
