import {EventSchemas, Inngest} from 'inngest'
import {
  AI_WRITING_COMPLETED_EVENT,
  AI_WRITING_REQUESTED_EVENT,
  AIWritingRequestCompleted,
  AIWritingRequested
} from "@/inngest/events";
import {MUX_WEBHOOK_EVENT, MuxWebhook} from "@/inngest/events/mux-webhook";
import {DEEPGRAM_WEBHOOK_EVENT, DeepgramWebhook} from "@/inngest/events/deepgram-webhook";
import {
  TRANSCRIPT_READY_EVENT,
  TRANSCRIPT_REQUESTED_EVENT, TranscriptReady,
  TranscriptRequested,
} from "@/inngest/events/transcript-requested";
import {VIDEO_UPLOADED_EVENT, VideoUploaded} from "@/inngest/events/video-uploaded";
import {POST_CREATION_REQUESTED_EVENT, PostCreationRequested} from "@/inngest/events/sanity-post";
import {MUX_SRT_READY_EVENT, MuxSrtReady} from "@/inngest/events/mux-add-srt-to-asset";

// Create a client to send and receive events
type Events = {
  [AI_WRITING_COMPLETED_EVENT]: AIWritingRequestCompleted,
  [AI_WRITING_REQUESTED_EVENT]: AIWritingRequested,
  [MUX_WEBHOOK_EVENT]: MuxWebhook,
  [DEEPGRAM_WEBHOOK_EVENT]: DeepgramWebhook,
  [TRANSCRIPT_REQUESTED_EVENT]: TranscriptRequested,
  [TRANSCRIPT_READY_EVENT]: TranscriptReady,
  [VIDEO_UPLOADED_EVENT]: VideoUploaded,
  [POST_CREATION_REQUESTED_EVENT]: PostCreationRequested,
  [MUX_SRT_READY_EVENT]: MuxSrtReady
}
export const inngest = new Inngest({
  id: 'gpt-4-ai-chains',
  schemas: new EventSchemas().fromRecord<Events>(),
})
