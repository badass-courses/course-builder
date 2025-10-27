'use server'

import { revalidatePath } from 'next/cache'

import {
	addQuestionToSurvey,
	createQuestion,
	createSurvey,
	deleteQuestion,
	deleteSurvey,
	removeQuestionFromSurvey,
	updateQuestion,
	updateQuestionPositions,
	updateSurvey,
} from './surveys-query'
import { SurveyWithQuestionsSchema, type SurveyFields } from './surveys-schemas'

/**
 * Server action to create a new survey
 */
export async function createSurveyAction(input: {
	title: string
	slug?: string
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
	type: 'multiple-choice' | 'multiple-image-choice' | 'essay' | 'code'
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
