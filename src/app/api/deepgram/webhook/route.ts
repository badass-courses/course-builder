import {NextRequest, NextResponse} from "next/server";
import {inngest} from "@/inngest/inngest.server";
import {srtProcessor, Word} from "@/lib/srt-processor";
import {DEEPGRAM_WEBHOOK_EVENT} from "@/inngest/events/deepgram-webhook";

export async function POST(req: NextRequest, res: NextResponse) {
  // todo: check MUX_WEBHOOK_SIGNING_SECRET to verify the request

  const url = new URL(req.url)
  const videoResourceId = url.searchParams.get('videoResourceId')
  const { results }: { results: any } = await req.json()

  if (!results) {
    return new Response(`Bad request`, { status: 400 })
  }



  const data = {
    videoResourceId,
    results
  }

  await inngest.send({
    name: DEEPGRAM_WEBHOOK_EVENT,
    data
  })

  return new Response('ok', {
    status: 200,
  })
}