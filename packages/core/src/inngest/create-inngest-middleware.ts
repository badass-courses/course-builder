import { EventSchemas, Inngest, InngestMiddleware } from 'inngest'

import { MockCourseBuilderAdapter, type CourseBuilderAdapter } from '../adapters'
import { MockTranscriptionProvider, type TranscriptionConfig } from '../providers'
import { courseBuilderCoreEvents } from './video-processing/events'

export interface CoreInngestContext {
  db: CourseBuilderAdapter
  siteRootUrl: string
  partyKitRootUrl: string
  transcriptProvider: TranscriptionConfig
  mediaUploadProvider: {
    deleteFiles: (fileKey: string) => Promise<{ success: boolean }>
  }
}

export const createInngestMiddleware = <TCourseBuilderContext extends CoreInngestContext = CoreInngestContext>(
  context: TCourseBuilderContext,
) => {
  return new InngestMiddleware({
    name: 'Course Builder Middleware',
    init() {
      return {
        onFunctionRun() {
          return {
            transformInput() {
              // kill me - this middleware is just for types
              type MappedCoreContext = {
                [K in keyof TCourseBuilderContext]: TCourseBuilderContext[K]
              }

              return { ctx: context as unknown as MappedCoreContext }
            },
          }
        },
      }
    },
  })
}

const schemas = new EventSchemas().fromRecord<courseBuilderCoreEvents>()

const coreInngest = new Inngest({
  id: 'core-inngest',
  schemas,
  middleware: [
    createInngestMiddleware({
      db: MockCourseBuilderAdapter,
      siteRootUrl: '',
      partyKitRootUrl: '',
      transcriptProvider: MockTranscriptionProvider,
      mediaUploadProvider: {
        deleteFiles: async (_) => Promise.resolve({ success: true }),
      },
    }),
  ],
})

export type CoreInngest = typeof coreInngest
