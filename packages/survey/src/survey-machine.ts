import every from 'lodash/every'
import isArray from 'lodash/isArray'
import isEmpty from 'lodash/isEmpty'
import shuffle from 'lodash/shuffle'
import { assign, createMachine, fromPromise } from 'xstate'

import type { QuestionResource, QuestionSet, SurveyConfig } from './types'

/**
 * Context type for the survey state machine
 */
export type SurveyMachineContext = {
	currentQuestionId: string
	questionSet: QuestionSet
	currentQuestion: QuestionResource
	answer: string | string[]
	answeredCorrectly: boolean
	config: SurveyConfig
	allAnswers: Record<string, string | string[]>
	handleSubmitAnswer: (context: SurveyMachineContext) => Promise<any>
}

/**
 * Event types for the survey state machine
 */
export type SurveyMachineEvent =
	| { type: 'ANSWER'; answer: string | string[] }
	| { type: 'ANSWERED' }
	| {
			type: 'LOAD_QUESTION'
			currentQuestion: QuestionResource
			currentQuestionId: string
	  }

const evaluateQuestion = (
	question: QuestionResource,
	answers: Record<string, string | string[]>,
) => {
	if (typeof question.question === 'function') {
		return {
			...question,
			question: question.question(answers),
		}
	}
	return question
}

const loadQuestion = (
	event: {
		type: 'LOAD_QUESTION'
		currentQuestion: QuestionResource
	},
	context: SurveyMachineContext,
) => {
	const question = evaluateQuestion(event.currentQuestion, context.allAnswers)
	console.log('question loading', { question })
	const shuffledChoices =
		question.correct || question.shuffleChoices
			? shuffle(question.choices)
			: question.choices

	console.log('shuffledChoices', { shuffledChoices })
	return { ...question, choices: shuffledChoices }
}

/**
 * Survey state machine that manages question flow and answer validation
 */
export const surveyMachine = createMachine(
	{
		id: 'quizMachine',
		initial: 'initializing',
		types: {} as {
			context: SurveyMachineContext
			events: SurveyMachineEvent
			input: Partial<SurveyMachineContext>
		},
		context: ({ input }) => ({
			currentQuestionId: input?.currentQuestionId || '',
			questionSet: input?.questionSet || {},
			currentQuestion: input?.currentQuestion || ({} as QuestionResource),
			answer: input?.answer || '',
			answeredCorrectly: input?.answeredCorrectly || false,
			config: input?.config || ({} as SurveyConfig),
			allAnswers: input?.allAnswers || {},
			handleSubmitAnswer:
				input?.handleSubmitAnswer || (() => Promise.resolve()),
		}),
		states: {
			initializing: {
				on: {
					LOAD_QUESTION: {
						actions: [
							assign({
								currentQuestion: ({ context, event }) =>
									loadQuestion(event, context),
								currentQuestionId: ({ event }) => event.currentQuestionId,
							}),
						],
						target: 'unanswered',
					},
				},
			},
			unanswered: {
				on: {
					ANSWER: {
						actions: [
							assign({
								answer: ({ event }) => event.answer,
								allAnswers: ({ context, event }) => ({
									...context.allAnswers,
									[context.currentQuestionId]: event.answer,
								}),
							}),
						],
						target: 'answering',
					},
					LOAD_QUESTION: {
						actions: [
							assign({
								currentQuestion: ({ context, event }) =>
									loadQuestion(event, context),
								currentQuestionId: ({ event }) => event.currentQuestionId,
							}),
						],
						target: 'unanswered',
					},
				},
			},
			answering: {
				invoke: {
					id: 'submitAnswer',
					src: 'submitAnswer',
					input: ({ context }) => context,
					onDone: [
						{
							target: 'answered',
							guard: ({ context }) => isEmpty(context.currentQuestion.correct),
						},
						{ target: 'answered.correct', guard: 'answeredCorrectly' },
						{ target: 'answered.incorrect' },
					],
					onError: { target: 'failure' },
				},
			},
			answered: {
				type: 'compound',
				initial: 'neutral',
				states: {
					correct: {},
					incorrect: {},
					neutral: {},
				},
			},
			failure: {},
		},
	},
	{
		guards: {
			answeredCorrectly: ({ context }) => {
				const hasMultipleCorrectAnswers = isArray(
					context.currentQuestion.correct,
				)
				const allCorrect =
					isArray(context.answer) &&
					every(
						(context.answer as string[]).map((a: string) =>
							(context.currentQuestion.correct as string[])?.includes(a),
						),
					)
				return hasMultipleCorrectAnswers
					? allCorrect
					: context.currentQuestion.correct === context.answer
			},
		},
		actors: {
			submitAnswer: fromPromise(
				async ({ input }: { input: SurveyMachineContext }) => {
					console.log('submitAnswer in machine', input)
					return input.handleSubmitAnswer(input)
				},
			),
		},
	},
)
