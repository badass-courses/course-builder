import * as React from 'react'

import type { QuizResource, SurveyConfig } from '@coursebuilder/survey'

import {
	dataTypescript2024,
	TYPESCRIPT_2024_SURVEY_ID,
} from './data-typescript-2024'

// import { WIZARD_QUIZ_ID } from './wizard-quiz-config'

export const surveyConfig: SurveyConfig = {
	afterCompletionMessages: {
		neutral: {
			default: `Thanks!`,
			last: `Thanks!`,
		},
		correct: {
			default: `Correct!`,
			last: `Correct! That's the final question.`,
		},
		incorrect: {
			default: `Not quite!`,
			last: `Not quite! That's the final question.`,
		},
	},
	questionBodyRenderer: undefined as
		| ((question: any) => React.ReactNode)
		| undefined,
}

export const typescript2024SurveyConfig: SurveyConfig = {
	afterCompletionMessages: {
		neutral: {
			default: 'Thanks for sharing your TypeScript journey with us!',
			last: 'Thanks for sharing your TypeScript journey with us!',
		},
		correct: {
			default: 'Correct!',
			last: 'Correct! Thanks for completing the survey.',
		},
		incorrect: {
			default: 'Not quite!',
			last: 'Not quite! Thanks for completing the survey.',
		},
	},
	questionBodyRenderer: undefined,
}

export const surveyData: { [SURVEY_ID: string]: QuizResource } = {
	ask: {
		questions: {
			level: {
				question: `👋 What's your current TypeScript skill level?`,
				type: 'multiple-choice',
				choices: [
					{
						answer: 'beginner',
						label: 'Beginner',
					},
					{
						answer: 'advanced-beginner',
						label: 'Advanced Beginner',
					},
					{
						answer: 'intermediate',
						label: 'Intermediate',
					},
					{
						answer: 'expert',
						label: 'Expert',
					},
					{
						answer: 'wizard',
						label: 'Wizard',
					},
				],
			},
			ts_at_work: {
				question: `Do you use TypeScript at work?`,
				type: 'multiple-choice',
				choices: [
					{
						answer: 'true',
						label: 'Yes, I use TypeScript at work.',
					},
					{
						answer: 'false',
						label: 'Nope',
					},
				],
			},
		},
	},
	[TYPESCRIPT_2024_SURVEY_ID]: dataTypescript2024,
	// [WIZARD_QUIZ_ID]: sortingHat2024,
}
