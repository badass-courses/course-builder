import {inngest} from "@/inngest/inngest.server";
import {DEEPGRAM_WEBHOOK_EVENT} from "@/inngest/events/deepgram-webhook";
import {TRANSCRIPT_READY_EVENT} from "@/inngest/events/transcript-requested";
import {srtFromTranscriptResult, transcriptAsParagraphsWithTimestamps} from "@/lib/deepgram-results-processor";

export const deepgramTranscriptReady = inngest.createFunction(
  {id: `deepgram-transcript-ready`, name: 'Deepgram Transcript Ready'},
  {
    event: DEEPGRAM_WEBHOOK_EVENT
  },
  async ({event, step}) => {
    const srt = srtFromTranscriptResult(event.data.results)
    const transcript = transcriptAsParagraphsWithTimestamps(event.data.results)

    await step.sendEvent('Let everybody know the transcript is ready.', {
      name: TRANSCRIPT_READY_EVENT,
      data: {
        videoResourceId: event.data.videoResourceId,
        moduleSlug: event.data.moduleSlug,
        srt,
        transcript
      }
    })

    return event.data
  }
)
