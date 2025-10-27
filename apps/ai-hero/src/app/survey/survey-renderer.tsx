import React from 'react'

import {
	OfferMachineEvent,
	SurveyMachineContext,
	SurveyQuestion,
	SurveyQuestionAnswer,
	SurveyQuestionBody,
	SurveyQuestionChoices,
	SurveyQuestionEmail,
	SurveyQuestionEssay,
	SurveyQuestionFooter,
	SurveyQuestionHeader,
	SurveyQuestionSubmit,
} from '@coursebuilder/survey'
import type {
	QuestionResource,
	SurveyConfig,
} from '@coursebuilder/survey/types'

/**
 * Survey renderer component demonstrating the composable styling pattern.
 * Each component accepts className to customize appearance with Tailwind.
 */

type SurveyPageProps = {
	currentQuestion: QuestionResource
	currentQuestionId: string
	handleSubmitAnswer: (context: SurveyMachineContext) => Promise<any>
	surveyConfig: SurveyConfig
	sendToMachine: (event: OfferMachineEvent) => void
	isComplete: boolean
	showEmailQuestion: boolean
	onEmailSubmit: (email: string) => void
	completionMessageComponent?: React.ReactNode
}

export const SurveyRenderer: React.FC<SurveyPageProps> = ({
	currentQuestion,
	currentQuestionId,
	handleSubmitAnswer,
	surveyConfig,
	sendToMachine,
	isComplete,
	showEmailQuestion,
	onEmailSubmit,
	completionMessageComponent = (
		<div className="mt-6 text-center">
			<h2 className="text-2xl font-bold">Thank you for your responses!</h2>
			<p className="mt-2">Your answers have been recorded.</p>
		</div>
	),
}) => {
	const handleAnswerSubmit = async (context: SurveyMachineContext) => {
		await handleSubmitAnswer(context)
	}

	if (showEmailQuestion) {
		return (
			<div className="mx-auto max-w-2xl p-6">
				<SurveyQuestionEmail
					onSubmit={onEmailSubmit}
					className="bg-card border-border space-y-4 rounded-xl border p-8 shadow-sm"
				/>
			</div>
		)
	}

	if (isComplete) {
		return completionMessageComponent
	}

	return (
		<SurveyQuestion
			config={surveyConfig}
			isLast={false}
			handleSubmitAnswer={handleAnswerSubmit}
			currentQuestion={currentQuestion}
			currentQuestionId={currentQuestionId}
			className="sm:bg-card border-border mx-auto w-full max-w-lg space-y-6 px-8 sm:rounded-xl sm:border sm:px-8 sm:py-8 sm:shadow-sm"
		>
			<SurveyQuestionHeader className="text-2xl font-bold" />
			<SurveyQuestionBody className="space-y-6">
				{currentQuestion.type === 'essay' ? (
					<SurveyQuestionEssay />
				) : (
					<SurveyQuestionChoices className="grid gap-3 [&_label]:text-base [&_label]:font-normal" />
				)}
				<SurveyQuestionSubmit className="">Submit Answer</SurveyQuestionSubmit>
				<SurveyQuestionAnswer />
			</SurveyQuestionBody>
			<SurveyQuestionFooter />
		</SurveyQuestion>
	)
}
