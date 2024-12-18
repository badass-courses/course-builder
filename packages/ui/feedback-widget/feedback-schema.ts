import { z } from 'zod'

export const feedbackContextSchema = z.object({
	url: z.string().optional(),
	category: z.enum(['general', 'help', 'code']).default('general'),
	emotion: z
		.enum([':heart_eyes:', ':unicorn_face:', ':sob:', ':wave:'])
		.default(':wave:'),
	location: z.string(),
})

export const feedbackFormSchema = z.object({
	text: z.string().min(1, 'Feedback is required'),
	context: feedbackContextSchema,
})

export type FeedbackContext = z.infer<typeof feedbackContextSchema>
export type FeedbackFormValues = z.infer<typeof feedbackFormSchema>
