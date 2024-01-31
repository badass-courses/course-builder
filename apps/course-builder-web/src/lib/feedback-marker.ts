import { z } from 'zod'

export const FeedbackMarkerSchema = z.object({
  originalText: z.string(),
  feedback: z.string(),
  fullSuggestedChange: z.string(),
  level: z.string(),
  type: z.string(),
})

export type FeedbackMarker = z.infer<typeof FeedbackMarkerSchema>
