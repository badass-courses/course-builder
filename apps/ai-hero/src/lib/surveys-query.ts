'use server'

import { revalidatePath } from 'next/cache'
import { emailListProvider } from '@/coursebuilder/email-list-provider'
import { db } from '@/db'
import {
	contentResource,
	contentResourceResource,
	questionResponse,
} from '@/db/schema'
import type { Subscriber } from '@/schemas/subscriber'
import { getServerAuthSession } from '@/server/auth'
import { log } from '@/server/logger'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'
import { and, asc, eq, or, sql } from 'drizzle-orm'
import { toSnakeCase } from 'drizzle-orm/casing'
import { z } from 'zod'

import { userSchema } from '@coursebuilder/core/schemas'
import { questionResponseSchema } from '@coursebuilder/core/schemas/question-response-schema'
import type {
	QuizResource,
	SurveyConfig,
	QuestionResource as SurveyQuestionResource,
	SurveyQuestionType,
} from '@coursebuilder/survey/types'

import {
	DEFAULT_AFTER_COMPLETION_MESSAGES,
	QuestionResponseWithUserSchema,
	SurveyWithQuestionsSchema,
	type QuestionFields,
	type SurveyFields,
} from './surveys'

/**
 * Creates a new survey with default configuration
 */
export async function createSurvey(input: {
	title: string
	slug?: string
	state?: SurveyFields['state']
	visibility?: SurveyFields['visibility']
	afterCompletionMessages?: SurveyFields['afterCompletionMessages']
}) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user

	if (!user || !ability.can('create', 'Content')) {
		await log.error('survey.create.unauthorized', { userId: user?.id })
		throw new Error('Unauthorized')
	}

	const hash = guid()
	const surveySlug = input.slug || slugify(`${input.title}-${hash}`)
	const surveyId = `survey-${hash}`

	const surveyData = {
		id: surveyId,
		type: 'survey',
		createdById: user.id,
		fields: {
			title: input.title,
			slug: surveySlug,
			state: input.state || ('draft' as const),
			visibility: input.visibility || ('unlisted' as const),
			afterCompletionMessages:
				input.afterCompletionMessages || DEFAULT_AFTER_COMPLETION_MESSAGES,
		},
	}

	await db.insert(contentResource).values(surveyData)

	await log.info('survey.created', {
		surveyId,
		title: input.title,
		userId: user.id,
	})

	return db.query.contentResource.findFirst({
		where: eq(contentResource.id, surveyId),
		with: {
			resources: {
				with: {
					resource: true,
				},
			},
		},
	})
}

/**
 * Updates an existing survey
 */
export async function updateSurvey(input: {
	id: string
	fields: Partial<SurveyFields>
}) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user

	if (!user || !ability.can('update', 'Content')) {
		await log.error('survey.update.unauthorized', {
			userId: user?.id,
			surveyId: input.id,
		})
		throw new Error('Unauthorized')
	}

	const existing = await db.query.contentResource.findFirst({
		where: and(
			eq(contentResource.id, input.id),
			eq(contentResource.type, 'survey'),
		),
	})

	if (!existing) {
		throw new Error('Survey not found')
	}

	const updatedFields = {
		...existing.fields,
		...input.fields,
	}

	await db
		.update(contentResource)
		.set({ fields: updatedFields })
		.where(eq(contentResource.id, input.id))

	await log.info('survey.updated', {
		surveyId: input.id,
		userId: user.id,
	})

	return db.query.contentResource.findFirst({
		where: eq(contentResource.id, input.id),
		with: {
			resources: {
				with: {
					resource: true,
				},
			},
		},
	})
}

/**
 * Deletes a survey and all associated questions
 */
export async function deleteSurvey(surveyId: string) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user

	if (!user || !ability.can('delete', 'Content')) {
		await log.error('survey.delete.unauthorized', {
			userId: user?.id,
			surveyId,
		})
		throw new Error('Unauthorized')
	}

	// Delete all question relationships
	await db
		.delete(contentResourceResource)
		.where(eq(contentResourceResource.resourceOfId, surveyId))

	// Delete the survey
	await db.delete(contentResource).where(eq(contentResource.id, surveyId))

	await log.info('survey.deleted', {
		surveyId,
		userId: user.id,
	})

	return { success: true }
}

/**
 * Gets a survey with all its questions by slug or id
 */
export async function getSurvey(slugOrId: string) {
	const survey = await db.query.contentResource.findFirst({
		where: and(
			or(
				eq(sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`, slugOrId),
				eq(contentResource.id, slugOrId),
			),
			eq(contentResource.type, 'survey'),
		),
		with: {
			resources: {
				with: {
					resource: true,
				},
				orderBy: asc(contentResourceResource.position),
			},
		},
	})

	if (!survey) {
		return null
	}

	const parsed = SurveyWithQuestionsSchema.safeParse(survey)
	if (!parsed.success) {
		await log.error('survey.parse.failed', {
			error: parsed.error.format(),
			slugOrId,
		})
		return null
	}

	return parsed.data
}

/**
 * Gets all surveys with question counts (for list views)
 */
export async function getAllSurveys() {
	const { session, ability } = await getServerAuthSession()
	const { SurveyWithQuestionsSchema } = await import('./surveys')

	if (!session?.user || !ability.can('create', 'Content')) {
		throw new Error('Unauthorized')
	}

	const surveys = await db.query.contentResource.findMany({
		where: eq(contentResource.type, 'survey'),
		orderBy: (table, { desc }) => [desc(table.createdAt)],
		with: {
			resources: {
				with: {
					resource: true,
				},
			},
		},
	})

	const parsed = z.array(SurveyWithQuestionsSchema).safeParse(surveys)
	if (!parsed.success) {
		await log.error('surveys.parse.failed', {
			error: parsed.error.format(),
		})
		return []
	}

	return parsed.data
}

/**
 * Creates a new question
 */
export async function createQuestion(input: {
	surveyId?: string
	slug: string
	question: string
	type: QuestionFields['type']
	choices?: QuestionFields['choices']
	required?: boolean
	shuffleChoices?: boolean
	allowMultiple?: boolean
	dependsOn?: QuestionFields['dependsOn']
}) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user

	if (!user || !ability.can('create', 'Content')) {
		await log.error('question.create.unauthorized', { userId: user?.id })
		throw new Error('Unauthorized')
	}

	const hash = guid()
	const questionId = `question-${hash}`

	const questionData = {
		id: questionId,
		type: 'question',
		createdById: user.id,
		fields: {
			slug: input.slug,
			question: input.question,
			type: input.type,
			choices: input.choices,
			required: input.required ?? false,
			shuffleChoices: input.shuffleChoices ?? false,
			allowMultiple: input.allowMultiple ?? false,
			dependsOn: input.dependsOn,
		},
	}

	await db.insert(contentResource).values(questionData)

	await log.info('question.created', {
		questionId,
		surveyId: input.surveyId,
		userId: user.id,
	})

	const question = await db.query.contentResource.findFirst({
		where: eq(contentResource.id, questionId),
	})

	// If surveyId provided, add to survey
	if (input.surveyId && question) {
		await addQuestionToSurvey({
			surveyId: input.surveyId,
			questionId: question.id,
		})
	}

	return question
}

/**
 * Updates an existing question
 */
export async function updateQuestion(input: {
	id: string
	fields: Partial<QuestionFields>
}) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user

	if (!user || !ability.can('update', 'Content')) {
		await log.error('question.update.unauthorized', {
			userId: user?.id,
			questionId: input.id,
		})
		throw new Error('Unauthorized')
	}

	const existing = await db.query.contentResource.findFirst({
		where: and(
			eq(contentResource.id, input.id),
			eq(contentResource.type, 'question'),
		),
	})

	if (!existing) {
		throw new Error('Question not found')
	}

	const updatedFields = {
		...existing.fields,
		...input.fields,
	}

	await db
		.update(contentResource)
		.set({ fields: updatedFields })
		.where(eq(contentResource.id, input.id))

	await log.info('question.updated', {
		questionId: input.id,
		userId: user.id,
	})

	return db.query.contentResource.findFirst({
		where: eq(contentResource.id, input.id),
	})
}

/**
 * Deletes a question
 */
export async function deleteQuestion(questionId: string) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user

	if (!user || !ability.can('delete', 'Content')) {
		await log.error('question.delete.unauthorized', {
			userId: user?.id,
			questionId,
		})
		throw new Error('Unauthorized')
	}

	// Delete all relationships
	await db
		.delete(contentResourceResource)
		.where(eq(contentResourceResource.resourceId, questionId))

	// Delete the question
	await db.delete(contentResource).where(eq(contentResource.id, questionId))

	await log.info('question.deleted', {
		questionId,
		userId: user.id,
	})

	return { success: true }
}

/**
 * Adds a question to a survey
 */
export async function addQuestionToSurvey(input: {
	surveyId: string
	questionId: string
	position?: number
}) {
	const { session, ability } = await getServerAuthSession()

	if (!session?.user || !ability.can('update', 'Content')) {
		throw new Error('Unauthorized')
	}

	// Get current questions count to set position
	const currentQuestions = await db.query.contentResourceResource.findMany({
		where: eq(contentResourceResource.resourceOfId, input.surveyId),
	})

	const position = input.position ?? currentQuestions.length

	await db.insert(contentResourceResource).values({
		resourceOfId: input.surveyId,
		resourceId: input.questionId,
		position,
	})

	await log.info('question.added.to.survey', {
		surveyId: input.surveyId,
		questionId: input.questionId,
		position,
	})

	return db.query.contentResourceResource.findFirst({
		where: and(
			eq(contentResourceResource.resourceOfId, input.surveyId),
			eq(contentResourceResource.resourceId, input.questionId),
		),
	})
}

/**
 * Removes a question from a survey
 */
export async function removeQuestionFromSurvey(input: {
	surveyId: string
	questionId: string
}) {
	const { session, ability } = await getServerAuthSession()

	if (!session?.user || !ability.can('update', 'Content')) {
		throw new Error('Unauthorized')
	}

	await db
		.delete(contentResourceResource)
		.where(
			and(
				eq(contentResourceResource.resourceOfId, input.surveyId),
				eq(contentResourceResource.resourceId, input.questionId),
			),
		)

	await log.info('question.removed.from.survey', {
		surveyId: input.surveyId,
		questionId: input.questionId,
	})

	return { success: true }
}

/**
 * Updates question positions in a survey
 */
export async function updateQuestionPositions(input: {
	surveyId: string
	questions: Array<{ questionId: string; position: number }>
}) {
	const { session, ability } = await getServerAuthSession()

	if (!session?.user || !ability.can('update', 'Content')) {
		throw new Error('Unauthorized')
	}

	await db.transaction(async (trx) => {
		for (const { questionId, position } of input.questions) {
			await trx
				.update(contentResourceResource)
				.set({ position })
				.where(
					and(
						eq(contentResourceResource.resourceOfId, input.surveyId),
						eq(contentResourceResource.resourceId, questionId),
					),
				)
		}
	})

	await log.info('question.positions.updated', {
		surveyId: input.surveyId,
		count: input.questions.length,
	})

	return { success: true }
}

/**
 * Transforms a DB survey into QuizResource format for survey machine
 */
export async function transformSurveyToQuizResource(
	survey: NonNullable<Awaited<ReturnType<typeof getSurvey>>>,
): Promise<QuizResource> {
	const questions: Record<string, SurveyQuestionResource> = {}

	// Build a map of question IDs to slugs for dependency resolution
	const idToSlugMap = new Map<string, string>()
	for (const { resource } of survey.resources || []) {
		if (resource.type === 'question') {
			const fields = resource.fields as any
			idToSlugMap.set(resource.id, fields.slug as string)
		}
	}

	for (const { resource } of survey.resources || []) {
		if (resource.type === 'question') {
			const fields = resource.fields as any
			const slug = fields.slug as string

			// Convert dependsOn.questionId to dependsOn.question (slug)
			let dependsOn = fields.dependsOn
			if (dependsOn?.questionId) {
				const parentSlug = idToSlugMap.get(dependsOn.questionId)
				if (parentSlug) {
					dependsOn = {
						question: parentSlug,
						answer: dependsOn.answer,
					}
				} else {
					// If parent question not found, skip the dependency
					dependsOn = undefined
				}
			}

			questions[slug] = {
				question: fields.question,
				type: fields.type,
				choices: fields.choices,
				required: fields.required,
				shuffleChoices: fields.shuffleChoices,
				allowMultiple: fields.allowMultiple,
				dependsOn,
				correct: fields.correct,
				answer: fields.answer,
				tagId: fields.tagId,
				template: fields.template,
				code: fields.code,
			}
		}
	}

	const surveyFields = survey.fields as any

	return {
		title: surveyFields.title,
		slug: surveyFields.slug,
		questions,
	}
}

/**
 * Builds SurveyConfig from survey fields
 */
export async function buildSurveyConfig(
	surveyFields: SurveyFields,
): Promise<SurveyConfig> {
	return {
		afterCompletionMessages:
			surveyFields.afterCompletionMessages || DEFAULT_AFTER_COMPLETION_MESSAGES,
		questionBodyRenderer: undefined,
	}
}

/**
 * Updates a subscriber custom field with the provided survey answer.
 * Use for learner/customer activity only (not internal ops).
 *
 * @param subscriber
 * @param question
 * @param answer
 */
export const answerSurvey = async ({
	subscriber,
	question,
	answer,
}: {
	subscriber: Subscriber
	question: string
	answer: string
}) => {
	try {
		if (!subscriber?.id || !subscriber?.email_address) {
			return { error: 'Missing subscriber identifiers' }
		}
		if (emailListProvider.updateSubscriberFields) {
			const response = await emailListProvider.updateSubscriberFields({
				subscriberId: subscriber.id.toString(),
				subscriberEmail: subscriber.email_address,
				fields: {
					[toSnakeCase(question)]: answer,
				},
			})

			return response
		} else {
			return { error: 'updateSubscriberFields is not supported' }
		}
	} catch (error) {
		log.error('answerSurvey failed', {
			err: (error as Error)?.message,
			subscriberId: subscriber?.id,
			question,
		})
		return { error: 'Failed to update subscriber fields' }
	}
}

/**
 * Server action to create a new survey
 */
export async function createSurveyAction(input: {
	title: string
	slug?: string
	state?: SurveyFields['state']
	visibility?: SurveyFields['visibility']
	afterCompletionMessages?: any
}) {
	const survey = await createSurvey(input)
	revalidatePath('/admin/surveys')
	const parsedSurvey = SurveyWithQuestionsSchema.safeParse(survey)
	if (!parsedSurvey.success) {
		throw new Error('Failed to parse survey')
	}
	return parsedSurvey.data
}

/**
 * Server action to update a survey
 */
export async function updateSurveyAction(input: {
	id: string
	fields: SurveyFields
}) {
	const survey = await updateSurvey(input)
	revalidatePath('/admin/surveys')
	revalidatePath(`/admin/surveys/${input.id}`)
	const parsedSurvey = SurveyWithQuestionsSchema.safeParse(survey)
	if (!parsedSurvey.success) {
		throw new Error('Failed to parse survey')
	}
	return parsedSurvey.data
}

/**
 * Server action to delete a survey
 */
export async function deleteSurveyAction(surveyId: string) {
	const result = await deleteSurvey(surveyId)
	revalidatePath('/admin/surveys')
	return result
}

/**
 * Server action to create a question
 */
export async function createQuestionAction(input: {
	surveyId?: string
	slug: string
	question: string
	type: SurveyQuestionType
	choices?: Array<{
		answer: string
		label?: string
		image?: string
	}>
	required?: boolean
	shuffleChoices?: boolean
	allowMultiple?: boolean
	dependsOn?: {
		questionId: string
		answer: string
	}
}) {
	const question = await createQuestion(input)
	if (input.surveyId) {
		revalidatePath(`/admin/surveys/${input.surveyId}`)
	}
	revalidatePath('/admin/surveys')
	return question
}

/**
 * Server action to update a question
 */
export async function updateQuestionAction(input: {
	id: string
	fields: any
	surveyId?: string
}) {
	const question = await updateQuestion(input)
	if (input.surveyId) {
		revalidatePath(`/admin/surveys/${input.surveyId}`)
	}
	revalidatePath('/admin/surveys')
	return question
}

/**
 * Server action to delete a question
 */
export async function deleteQuestionAction(input: {
	questionId: string
	surveyId?: string
}) {
	const result = await deleteQuestion(input.questionId)
	if (input.surveyId) {
		revalidatePath(`/admin/surveys/${input.surveyId}`)
	}
	revalidatePath('/admin/surveys')
	return result
}

/**
 * Server action to add a question to a survey
 */
export async function addQuestionToSurveyAction(input: {
	surveyId: string
	questionId: string
	position?: number
}) {
	const result = await addQuestionToSurvey(input)
	revalidatePath(`/admin/surveys/${input.surveyId}`)
	revalidatePath('/admin/surveys')
	return result
}

/**
 * Server action to remove a question from a survey
 */
export async function removeQuestionFromSurveyAction(input: {
	surveyId: string
	questionId: string
}) {
	const result = await removeQuestionFromSurvey(input)
	revalidatePath(`/admin/surveys/${input.surveyId}`)
	revalidatePath('/admin/surveys')
	return result
}

/**
 * Server action to update question positions
 */
export async function updateQuestionPositionsAction(input: {
	surveyId: string
	questions: Array<{ questionId: string; position: number }>
}) {
	const result = await updateQuestionPositions(input)
	revalidatePath(`/admin/surveys/${input.surveyId}`)
	return result
}

export async function getSurveyResponses(surveyId: string) {
	const responses = await db.query.questionResponse.findMany({
		where: eq(questionResponse.surveyId, surveyId),
		with: {
			user: true,
			question: true,
		},
	})

	if (!responses) {
		return null
	}

	const parsedResponses = z
		.array(QuestionResponseWithUserSchema)
		.safeParse(responses)
	if (!parsedResponses.success) {
		throw new Error('Failed to parse responses')
	}
	return parsedResponses.data
}
