import { z } from 'zod'

export const questionResponseSchema = z.object({
	id: z.string().max(255),
	surveyId: z.string().max(255),
	questionId: z.string().max(255),
	userId: z.string().max(255).optional().nullable(),
	emailListSubscriberId: z.string().max(255).optional().nullable(),
	fields: z.record(z.any()).default({}),
	createdAt: z.date(),
	updatedAt: z.date(),
	deletedAt: z.date().optional().nullable(),
})

export type QuestionResponse = z.infer<typeof questionResponseSchema>
