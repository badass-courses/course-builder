'use client'

import React from 'react'
import LayoutClient from '@/components/layout-client'
import { api } from '@/trpc/react'

import {
	useSurveyPageOfferMachine,
	type QuestionResource,
} from '@coursebuilder/survey'

import {
	dataTypescript2024,
	TYPESCRIPT_2024_SURVEY_ID,
} from './data-typescript-2024'
import { surveyConfig } from './survey-config'
import { SurveyRenderer } from './survey-renderer'

export default function Survey() {
	const { data: subscriberData, status } =
		api.ability.getCurrentSubscriberFromCookie.useQuery()

	const {
		currentQuestion,
		currentQuestionId,
		isLoading,
		isComplete,
		isPresenting,
		sendToMachine,
		handleSubmitAnswer,
		subscriber,
		answers,
		machineState,
	} = useSurveyPageOfferMachine(
		dataTypescript2024,
		TYPESCRIPT_2024_SURVEY_ID,
		subscriberData,
		status === 'pending',
	)
	const answerSurveyMutation = api.convertkit.answerSurvey.useMutation()
	const answerSurveyMultipleMutation =
		api.convertkit.answerSurveyMultiple.useMutation()
	const [email, setEmail] = React.useState<string | null>(null)

	const handleEmailSubmit = async (email: string) => {
		// Here you would typically send the email and answers to your backend

		setEmail(email)
		sendToMachine({ type: 'EMAIL_COLLECTED' })
	}

	React.useEffect(() => {
		if (isComplete && machineState.matches('offerComplete')) {
			answerSurveyMultipleMutation.mutate({
				email: email || subscriber?.email_address,
				answers,
				surveyId: TYPESCRIPT_2024_SURVEY_ID,
			})
		}
	}, [isComplete])

	return (
		<LayoutClient withContainer>
			<div id="ask">
				{isLoading ? (
					<div className="text-center text-2xl">Loading survey...</div>
				) : !currentQuestion && !isPresenting ? (
					<div className="text-center text-2xl">
						No survey available at this time.
					</div>
				) : (
					<SurveyRenderer
						currentQuestionId={currentQuestionId}
						currentQuestion={currentQuestion as QuestionResource}
						handleSubmitAnswer={async (context) => {
							if (email || subscriber?.email_address) {
								answerSurveyMutation.mutate({
									answer: Array.isArray(context.answer)
										? context.answer.join(', ')
										: context.answer,
									question: context.currentQuestionId,
								})
							}
							await handleSubmitAnswer(context)
						}}
						surveyConfig={surveyConfig}
						sendToMachine={sendToMachine}
						isComplete={isComplete}
						showEmailQuestion={machineState.matches('collectEmail')}
						onEmailSubmit={handleEmailSubmit}
					/>
				)}
			</div>
		</LayoutClient>
	)
}
