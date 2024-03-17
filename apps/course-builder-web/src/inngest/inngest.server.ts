import { EMAIL_SEND_BROADCAST, EmailSendBroadcast } from '@/inngest/events/email-send-broadcast'
import { IMAGE_RESOURCE_CREATED_EVENT, ImageResourceCreated } from '@/inngest/events/image-resource-created'
import { POSTMARK_WEBHOOK_EVENT, PostmarkWebhook } from '@/inngest/events/postmark-webhook'
import { RESOURCE_CHAT_REQUEST_EVENT, ResourceChat } from '@/inngest/events/resource-chat-request'
import { USER_CREATED_EVENT, UserCreated } from '@/inngest/events/user-created'
import { type MUX_WEBHOOK_EVENT, type VideoMuxWebhook } from '@/inngest/video-processing/events/video-mux-webhook'
import { VIDEO_RESOURCE_CREATED_EVENT, VideoResourceCreated } from '@/inngest/video-processing/events/video-resource'
import { VIDEO_SRT_READY_EVENT, type VideoSrtReady } from '@/inngest/video-processing/events/video-srt-ready-to-asset'
import { VIDEO_STATUS_CHECK_EVENT, VideoStatusCheck } from '@/inngest/video-processing/events/video-status-check'
import {
  VIDEO_TRANSCRIPT_READY_EVENT,
  VideoTranscriptReady,
} from '@/inngest/video-processing/events/video-transcript-ready'
import { type VIDEO_UPLOADED_EVENT, type VideoUploaded } from '@/inngest/video-processing/events/video-uploaded'
import { EventSchemas, Inngest } from 'inngest'

import {
  CONCEPT_SELECTED,
  CONCEPT_TAGS_REQUESTED,
  REQUEST_CONCEPT_SELECTION,
  type ConceptSelected,
  type ConceptTagsRequested,
  type RequestConceptSelection,
} from './events/concepts'
import { OCR_WEBHOOK_EVENT, OcrWebhook } from './events/ocr-webhook'
import { REQUEST_VIDEO_SPLIT_POINTS, type RequestVideoSplitPoints } from './events/split_video'

// Create a client to send and receive events
type Events = {
  [MUX_WEBHOOK_EVENT]: VideoMuxWebhook
  [VIDEO_TRANSCRIPT_READY_EVENT]: VideoTranscriptReady
  [VIDEO_UPLOADED_EVENT]: VideoUploaded
  [VIDEO_SRT_READY_EVENT]: VideoSrtReady
  [USER_CREATED_EVENT]: UserCreated
  [POSTMARK_WEBHOOK_EVENT]: PostmarkWebhook
  [IMAGE_RESOURCE_CREATED_EVENT]: ImageResourceCreated
  [RESOURCE_CHAT_REQUEST_EVENT]: ResourceChat
  [VIDEO_STATUS_CHECK_EVENT]: VideoStatusCheck
  [VIDEO_RESOURCE_CREATED_EVENT]: VideoResourceCreated
  [EMAIL_SEND_BROADCAST]: EmailSendBroadcast
  [OCR_WEBHOOK_EVENT]: OcrWebhook
  [CONCEPT_TAGS_REQUESTED]: ConceptTagsRequested
  [REQUEST_CONCEPT_SELECTION]: RequestConceptSelection
  [CONCEPT_SELECTED]: ConceptSelected
  [REQUEST_VIDEO_SPLIT_POINTS]: RequestVideoSplitPoints
}
export const inngest = new Inngest({
  id: 'course-builder',
  schemas: new EventSchemas().fromRecord<Events>(),
})
