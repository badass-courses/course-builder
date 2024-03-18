import { EventSchemas, Inngest, InngestMiddleware } from 'inngest'

import { MockCourseBuilderAdapter, type CourseBuilderAdapter } from '../adapters'
import {
  EventVideoMuxWebhook,
  EventVideoStatusCheck,
  EventVideoTranscriptReady,
  EventVideoUploaded,
  MUX_WEBHOOK_EVENT,
  VIDEO_RESOURCE_CREATED_EVENT,
  VIDEO_SRT_READY_EVENT,
  VIDEO_STATUS_CHECK_EVENT,
  VIDEO_TRANSCRIPT_READY_EVENT,
  VIDEO_UPLOADED_EVENT,
  VideoResourceCreated,
  VideoSrtReady,
} from './video-processing/events'

type Events = {
  [MUX_WEBHOOK_EVENT]: EventVideoMuxWebhook
  [VIDEO_TRANSCRIPT_READY_EVENT]: EventVideoTranscriptReady
  [VIDEO_UPLOADED_EVENT]: EventVideoUploaded
  [VIDEO_SRT_READY_EVENT]: VideoSrtReady
  [VIDEO_STATUS_CHECK_EVENT]: EventVideoStatusCheck
  [VIDEO_RESOURCE_CREATED_EVENT]: VideoResourceCreated
}

const middleware = new InngestMiddleware({
  name: 'Supply Context',
  init() {
    return {
      onFunctionRun(event) {
        return {
          transformInput: (input) => {
            return { ctx: { db: MockCourseBuilderAdapter } }
          },
        }
      },
    }
  },
})

export const inngest = new Inngest({
  id: 'course-builder-core',
  middleware: [middleware],
  schemas: new EventSchemas().fromRecord<Events>(),
})
