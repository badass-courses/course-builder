import {
  ARTICLE_CHAT_EVENT,
  ArticleChat,
  BODY_TEXT_UPDATED,
  BodyTextUpdated,
  TIP_CHAT_EVENT,
  TipChat,
  type AI_WRITING_COMPLETED_EVENT,
  type AIWritingRequestCompleted,
  type DRAFT_WRITEUP_COMPLETED_EVENT,
  type DraftWriteupCompleted,
  type USER_CREATED_EVENT,
  type UserCreated,
} from '@/inngest/events'
import { CLOUDINARY_WEBHOOK_EVENT, CloudinaryWebhook } from '@/inngest/events/cloudinary-webhook'
import { type DEEPGRAM_WEBHOOK_EVENT, type DeepgramWebhook } from '@/inngest/events/deepgram-webhook'
import { type MUX_SRT_READY_EVENT, type MuxSrtReady } from '@/inngest/events/mux-add-srt-to-asset'
import { type MUX_WEBHOOK_EVENT, type MuxWebhook } from '@/inngest/events/mux-webhook'
import { POSTMARK_WEBHOOK_EVENT, PostmarkWebhook } from '@/inngest/events/postmark-webhook'
import { type POST_CREATION_REQUESTED_EVENT, type PostCreationRequested } from '@/inngest/events/sanity-post'
import { type TRANSCRIPT_READY_EVENT, type TranscriptReady } from '@/inngest/events/transcript-requested'
import { VIDEO_RESOURCE_CREATED_EVENT, VideoResourceCreated } from '@/inngest/events/video-resource'
import { VIDEO_STATUS_CHECK_EVENT, VideoStatusCheck } from '@/inngest/events/video-status-check'
import { type VIDEO_UPLOADED_EVENT, type VideoUploaded } from '@/inngest/events/video-uploaded'
import { EventSchemas, Inngest } from 'inngest'

// Create a client to send and receive events
type Events = {
  [AI_WRITING_COMPLETED_EVENT]: AIWritingRequestCompleted
  [MUX_WEBHOOK_EVENT]: MuxWebhook
  [DEEPGRAM_WEBHOOK_EVENT]: DeepgramWebhook
  [TRANSCRIPT_READY_EVENT]: TranscriptReady
  [VIDEO_UPLOADED_EVENT]: VideoUploaded
  [POST_CREATION_REQUESTED_EVENT]: PostCreationRequested
  [MUX_SRT_READY_EVENT]: MuxSrtReady
  [USER_CREATED_EVENT]: UserCreated
  [POSTMARK_WEBHOOK_EVENT]: PostmarkWebhook
  [CLOUDINARY_WEBHOOK_EVENT]: CloudinaryWebhook
  [TIP_CHAT_EVENT]: TipChat
  [ARTICLE_CHAT_EVENT]: ArticleChat
  [BODY_TEXT_UPDATED]: BodyTextUpdated
  [VIDEO_STATUS_CHECK_EVENT]: VideoStatusCheck
  [VIDEO_RESOURCE_CREATED_EVENT]: VideoResourceCreated
  [DRAFT_WRITEUP_COMPLETED_EVENT]: DraftWriteupCompleted
}
export const inngest = new Inngest({
  id: 'course-builder',
  schemas: new EventSchemas().fromRecord<Events>(),
})
