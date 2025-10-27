import React from 'react'

import {
	SurveyQuestion,
	SurveyQuestionAnswer,
	SurveyQuestionBody,
	SurveyQuestionChoices,
	SurveyQuestionEmail,
	SurveyQuestionEssay,
	SurveyQuestionFooter,
	SurveyQuestionHeader,
	SurveyQuestionSubmit,
	type OfferMachineEvent,
	type QuestionResource,
	type SurveyConfig,
	type SurveyMachineContext,
} from '@coursebuilder/survey'

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
				<SurveyQuestionEmail onSubmit={onEmailSubmit} />
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
		>
			<SurveyQuestionHeader />
			<SurveyQuestionBody>
				{currentQuestion.type === 'essay' ? (
					<SurveyQuestionEssay />
				) : (
					<SurveyQuestionChoices />
				)}
				<SurveyQuestionSubmit>Submit</SurveyQuestionSubmit>
				<SurveyQuestionAnswer />
			</SurveyQuestionBody>
			<SurveyQuestionFooter />
		</SurveyQuestion>
	)
}
