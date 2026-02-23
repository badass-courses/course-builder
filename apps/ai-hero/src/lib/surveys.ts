import { questionResponse } from '@/db/schema'
import { z } from 'zod'

import { questionResponseSchema, userSchema } from '@coursebuilder/core/schemas'
import { ContentResourceSchema } from '@coursebuilder/core/schemas/content-resource-schema'
import {
	ChoiceSchema,
	QuestionResourceSchema,
} from '@coursebuilder/survey/types'

/**
 * Shared Zod schemas for survey and question content resources
 */

// Question fields schema matching QuestionResource from survey package
export const QuestionFieldsSchema = QuestionResourceSchema.extend({
	question: z.string(), // Admin CRUD only handles string questions
	slug: z.string(),
	dependsOn: z
		.object({
			questionId: z.string(),
			answer: z.string(),
		})
		.optional(),
	code: z
		.array(
			z.object({
				filename: z.string(),
				active: z.boolean(),
				code: z.string(),
			}),
		)
		.optional(),
})

// After completion messages schema
export const AfterCompletionMessagesSchema = z.object({
	askForEmail: z.object({
		title: z.string(),
		description: z.string(),
	}),
	neutral: z.object({
		default: z.string(),
		last: z.string(),
	}),
	correct: z.object({
		default: z.string(),
		last: z.string(),
	}),
	incorrect: z.object({
		default: z.string(),
		last: z.string(),
	}),
})

// Survey fields schema
export const SurveyFieldsSchema = z.object({
	title: z.string(),
	slug: z.string(),
	state: z.enum(['draft', 'published']).default('draft'),
	visibility: z.enum(['public', 'private', 'unlisted']).default('unlisted'),
	afterCompletionMessages: AfterCompletionMessagesSchema.optional(),
})

/**
 * API schema for creating a survey.
 */
export const CreateSurveyApiInputSchema = z.object({
	title: z.string().min(1),
	slug: z
		.string()
		.min(1)
		.max(120)
		.regex(/^[a-z0-9-]+$/)
		.optional(),
	state: z.enum(['draft', 'published']).optional(),
	visibility: z.enum(['public', 'private', 'unlisted']).optional(),
	afterCompletionMessages: AfterCompletionMessagesSchema.optional(),
})

/**
 * API schema for updating a survey.
 */
export const UpdateSurveyApiInputSchema = z.object({
	id: z.string().min(1),
	title: z.string().min(1).optional(),
	slug: z
		.string()
		.min(1)
		.max(120)
		.regex(/^[a-z0-9-]+$/)
		.optional(),
	state: z.enum(['draft', 'published']).optional(),
	visibility: z.enum(['public', 'private', 'unlisted']).optional(),
	afterCompletionMessages: AfterCompletionMessagesSchema.optional(),
})

// Question content resource schema
export const QuestionSchema = ContentResourceSchema.merge(
	z.object({
		type: z.literal('question'),
		fields: QuestionFieldsSchema,
	}),
)

// Survey content resource schema
export const SurveySchema = ContentResourceSchema.merge(
	z.object({
		type: z.literal('survey'),
		fields: SurveyFieldsSchema,
	}),
)

// Survey with questions relationship - extends base ContentResourceResource schema
const SurveyResourceRelationSchema = z.object({
	resourceOfId: z.string(),
	resourceId: z.string(),
	position: z.number(),
	metadata: z.record(z.string(), z.any()).nullable(),
	createdAt: z.coerce.date().nullable(),
	updatedAt: z.coerce.date().nullable(),
	deletedAt: z.coerce.date().nullable(),
	resource: QuestionSchema,
})

// Full survey with questions - override resources to be typed properly
export const SurveyWithQuestionsSchema = SurveySchema.extend({
	resources: z.array(SurveyResourceRelationSchema).nullable(),
})

// Exported type aliases
export type Choice = z.infer<typeof ChoiceSchema>
export type QuestionFields = z.infer<typeof QuestionFieldsSchema>
export type SurveyFields = z.infer<typeof SurveyFieldsSchema>
export type AfterCompletionMessages = z.infer<
	typeof AfterCompletionMessagesSchema
>
export type Question = z.infer<typeof QuestionSchema>
export type Survey = z.infer<typeof SurveySchema>
export type SurveyWithQuestions = z.infer<typeof SurveyWithQuestionsSchema>
export type CreateSurveyApiInput = z.infer<typeof CreateSurveyApiInputSchema>
export type UpdateSurveyApiInput = z.infer<typeof UpdateSurveyApiInputSchema>

// Default values
export const DEFAULT_AFTER_COMPLETION_MESSAGES: AfterCompletionMessages = {
	askForEmail: {
		title: 'Thank you for completing the survey!',
		description:
			'Please enter your email to receive updates and insights based on the survey results:',
	},
	neutral: {
		default: 'Thanks!',
		last: 'Thank you for your responses!',
	},
	correct: {
		default: 'Correct!',
		last: "Correct! That's the final question.",
	},
	incorrect: {
		default: 'Not quite!',
		last: "Not quite! That's the final question.",
	},
}

export const QuestionResponseSchema = questionResponse

export const QuestionResponseWithUserSchema = questionResponseSchema.extend({
	user: userSchema.optional().nullable(),
	question: QuestionSchema,
})

export type QuestionResponseWithUser = z.infer<
	typeof QuestionResponseWithUserSchema
>

export interface SurveyQuestionAnalytics {
	questionId: string
	questionSlug: string | null
	question: string
	type: string | null
	responses: number
}

export interface SurveyRecentResponse {
	id: string
	questionId: string
	questionSlug: string | null
	question: string
	answer: string
	userId: string | null
	userEmail: string | null
	emailListSubscriberId: string | null
	createdAt: Date
}

export interface SurveyAnalytics {
	surveyId: string
	surveySlug: string
	surveyTitle: string
	totalResponses: number
	uniqueRespondents: number
	responsesByDay: Array<{ date: string; responses: number }>
	topQuestions: SurveyQuestionAnalytics[]
	recentResponses: SurveyRecentResponse[]
}
