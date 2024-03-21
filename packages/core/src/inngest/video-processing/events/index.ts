import { MUX_WEBHOOK_EVENT, type MuxWebhookEvent } from './event-video-mux-webhook'
import {
  VIDEO_RESOURCE_CREATED_EVENT,
  type VideoResourceCreated,
  type VideoResourceCreatedEvent,
} from './event-video-resource'
import { VIDEO_SRT_READY_EVENT, type VideoSrtReady, type VideoSrtReadyEvent } from './event-video-srt-ready-to-asset'
import {
  VIDEO_STATUS_CHECK_EVENT,
  type EventVideoStatusCheck,
  type VideoStatusCheckEvent,
} from './event-video-status-check'
import {
  VIDEO_TRANSCRIPT_READY_EVENT,
  type EventVideoTranscriptReady,
  type VideoTranscriptReadyEvent,
} from './event-video-transcript-ready'
import { VIDEO_UPLOADED_EVENT, type EventVideoUploaded, type VideoUploadedEvent } from './event-video-uploaded'

export * from './event-video-status-check'
export * from './event-video-transcript-ready'
export * from './event-video-srt-ready-to-asset'
export * from './event-video-uploaded'
export * from './event-video-resource'
export * from './event-video-mux-webhook'

export type courseBuilderCoreEvents = {
  [VIDEO_STATUS_CHECK_EVENT]: EventVideoStatusCheck
  [VIDEO_TRANSCRIPT_READY_EVENT]: EventVideoTranscriptReady
  [VIDEO_SRT_READY_EVENT]: VideoSrtReady
  [VIDEO_UPLOADED_EVENT]: EventVideoUploaded
  [VIDEO_RESOURCE_CREATED_EVENT]: VideoResourceCreated
  [MUX_WEBHOOK_EVENT]: MuxWebhookEvent
}
