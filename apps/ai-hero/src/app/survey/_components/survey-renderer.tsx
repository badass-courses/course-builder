import React from 'react'
import { CheckCircle } from 'lucide-react'
import Markdown from 'react-markdown'

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
		<div className="flex flex-col gap-3 py-10 text-center">
			<Markdown
				components={{
					p: ({ children }) => (
						<h2 className="text-2xl font-bold">{children}</h2>
					),
				}}
			>
				{surveyConfig.afterCompletionMessages.neutral.last ||
					'Thank you for your responses!'}
			</Markdown>
			<p className="inline-block text-center text-emerald-600 dark:text-emerald-300">
				<CheckCircle className="inline-block size-4" /> Your answers have been
				recorded.
			</p>
		</div>
	),
}) => {
	const handleAnswerSubmit = async (context: SurveyMachineContext) => {
		await handleSubmitAnswer(context)
	}

	if (isComplete) {
		return completionMessageComponent
	}

	return (
		<SurveyQuestion
			className="flex w-full flex-col gap-5"
			config={surveyConfig}
			isLast={false}
			handleSubmitAnswer={handleAnswerSubmit}
			currentQuestion={currentQuestion}
			currentQuestionId={currentQuestionId}
			asChild={showEmailQuestion}
		>
			{showEmailQuestion ? (
				<div className="mx-auto">
					<SurveyQuestionEmail onSubmit={onEmailSubmit} className="" />
				</div>
			) : (
				<>
					<SurveyQuestionHeader className="text-2xl font-bold" />
					<SurveyQuestionBody className="flex flex-col gap-1 space-y-6">
						{currentQuestion.type === 'essay' ? (
							<SurveyQuestionEssay />
						) : (
							<SurveyQuestionChoices className="[&_label]:hover:bg-muted divide-border flex flex-col gap-0 divide-y [&_label]:w-full [&_label]:p-3 [&_label]:text-base [&_label]:font-normal" />
						)}
						<SurveyQuestionSubmit className="dark:bg-primary dark:text-primary-foreground cursor-pointer bg-blue-600 text-white hover:bg-blue-700">
							Submit
						</SurveyQuestionSubmit>
						<SurveyQuestionAnswer />
					</SurveyQuestionBody>
					<SurveyQuestionFooter />
				</>
			)}
		</SurveyQuestion>
	)
}
