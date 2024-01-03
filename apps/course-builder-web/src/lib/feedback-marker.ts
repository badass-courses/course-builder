import {z} from 'zod'

export const FeedbackMarkerSchema = z.object({
  originalText: z.string(),
  lineNumberStart: z.number(),
  lineNumberEnd: z.number(),
  columnStart: z.number(),
  columnEnd: z.number(),
  feedback: z.string(),
  fullSuggestedChange: z.string(),
  level: z.string(),
  type: z.string(),
})

export type FeedbackMarker = z.infer<typeof FeedbackMarkerSchema>
