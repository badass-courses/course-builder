import {EventSchemas, Inngest} from 'inngest'
import {
  type AI_TIP_WRITING_REQUESTED_EVENT,
  type AI_WRITING_COMPLETED_EVENT,
  type AI_WRITING_REQUESTED_EVENT,
  type AITipWritingRequested,
  type AIWritingRequestCompleted,
  type AIWritingRequested,
  type USER_CREATED_EVENT,
  type UserCreated,
} from '@/inngest/events'
import {
  type MUX_WEBHOOK_EVENT,
  type MuxWebhook,
} from '@/inngest/events/mux-webhook'
import {
  type DEEPGRAM_WEBHOOK_EVENT,
  type DeepgramWebhook,
} from '@/inngest/events/deepgram-webhook'
import {
  type TRANSCRIPT_READY_EVENT,
  type TranscriptReady,
} from '@/inngest/events/transcript-requested'
import {
  type VIDEO_UPLOADED_EVENT,
  type VideoUploaded,
} from '@/inngest/events/video-uploaded'
import {
  type POST_CREATION_REQUESTED_EVENT,
  type PostCreationRequested,
} from '@/inngest/events/sanity-post'
import {
  type MUX_SRT_READY_EVENT,
  type MuxSrtReady,
} from '@/inngest/events/mux-add-srt-to-asset'

// Create a client to send and receive events
type Events = {
  [AI_WRITING_COMPLETED_EVENT]: AIWritingRequestCompleted
  [AI_WRITING_REQUESTED_EVENT]: AIWritingRequested
  [MUX_WEBHOOK_EVENT]: MuxWebhook
  [DEEPGRAM_WEBHOOK_EVENT]: DeepgramWebhook
  [TRANSCRIPT_READY_EVENT]: TranscriptReady
  [VIDEO_UPLOADED_EVENT]: VideoUploaded
  [POST_CREATION_REQUESTED_EVENT]: PostCreationRequested
  [MUX_SRT_READY_EVENT]: MuxSrtReady
  [AI_TIP_WRITING_REQUESTED_EVENT]: AITipWritingRequested
  [USER_CREATED_EVENT]: UserCreated
}
export const inngest = new Inngest({
  id: 'gpt-4-ai-chains',
  schemas: new EventSchemas().fromRecord<Events>(),
})
