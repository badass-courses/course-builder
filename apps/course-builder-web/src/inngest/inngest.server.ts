import { db } from '@/db'
import { mysqlTable } from '@/db/schema'
import { env } from '@/env.mjs'
import { EMAIL_SEND_BROADCAST, EmailSendBroadcast } from '@/inngest/events/email-send-broadcast'
import { IMAGE_RESOURCE_CREATED_EVENT, ImageResourceCreated } from '@/inngest/events/image-resource-created'
import { POSTMARK_WEBHOOK_EVENT, PostmarkWebhook } from '@/inngest/events/postmark-webhook'
import { RESOURCE_CHAT_REQUEST_EVENT, ResourceChat } from '@/inngest/events/resource-chat-request'
import { USER_CREATED_EVENT, UserCreated } from '@/inngest/events/user-created'
import { EventSchemas, Inngest } from 'inngest'
import { UTApi } from 'uploadthing/server'

import { DrizzleAdapter } from '@coursebuilder/adapter-drizzle'
import { createInngestMiddleware } from '@coursebuilder/core/inngest/create-inngest-middleware'
import {
  MUX_WEBHOOK_EVENT,
  VIDEO_RESOURCE_CREATED_EVENT,
  VIDEO_SRT_READY_EVENT,
  VIDEO_STATUS_CHECK_EVENT,
  VIDEO_TRANSCRIPT_READY_EVENT,
  VIDEO_UPLOADED_EVENT,
  type EventVideoMuxWebhook,
  type EventVideoStatusCheck,
  type EventVideoTranscriptReady,
  type EventVideoUploaded,
  type VideoResourceCreated,
  type VideoSrtReady,
} from '@coursebuilder/core/inngest/video-processing/events'
import DeepgramProvider from '@coursebuilder/core/providers/deepgram'

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
export type Events = {
  [MUX_WEBHOOK_EVENT]: EventVideoMuxWebhook
  [VIDEO_TRANSCRIPT_READY_EVENT]: EventVideoTranscriptReady
  [VIDEO_UPLOADED_EVENT]: EventVideoUploaded
  [VIDEO_SRT_READY_EVENT]: VideoSrtReady
  [USER_CREATED_EVENT]: UserCreated
  [POSTMARK_WEBHOOK_EVENT]: PostmarkWebhook
  [IMAGE_RESOURCE_CREATED_EVENT]: ImageResourceCreated
  [RESOURCE_CHAT_REQUEST_EVENT]: ResourceChat
  [VIDEO_STATUS_CHECK_EVENT]: EventVideoStatusCheck
  [VIDEO_RESOURCE_CREATED_EVENT]: VideoResourceCreated
  [EMAIL_SEND_BROADCAST]: EmailSendBroadcast
  [OCR_WEBHOOK_EVENT]: OcrWebhook
  [CONCEPT_TAGS_REQUESTED]: ConceptTagsRequested
  [REQUEST_CONCEPT_SELECTION]: RequestConceptSelection
  [CONCEPT_SELECTED]: ConceptSelected
  [REQUEST_VIDEO_SPLIT_POINTS]: RequestVideoSplitPoints
}

const callbackBase = env.NODE_ENV === 'production' ? env.UPLOADTHING_URL : env.NEXT_PUBLIC_URL

const middleware = createInngestMiddleware({
  db: DrizzleAdapter(db, mysqlTable),
  siteRootUrl: env.NEXT_PUBLIC_URL,
  partyKitRootUrl: env.NEXT_PUBLIC_PARTY_KIT_URL,
  mediaUploadProvider: new UTApi(),
  transcriptProvider: DeepgramProvider({
    apiKey: env.DEEPGRAM_API_KEY,
    callbackUrl: `${callbackBase}/api/coursebuilder/webhook/deepgram`,
  }),
})

export const inngest = new Inngest({
  id: 'course-builder',
  middleware: [middleware],
  schemas: new EventSchemas().fromRecord<Events>(),
})
