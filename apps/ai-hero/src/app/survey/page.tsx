'use client'

import React from 'react'
import LayoutClient from '@/components/layout-client'
import { api } from '@/trpc/react'

import { useSurveyPageOfferMachine } from '@coursebuilder/survey'
import type { QuestionResource } from '@coursebuilder/survey/types'

import { setSubscriberCookie } from '../(content)/survey/actions'
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
	const answerSurveyMutation = api.convertkit.answerSurvey.useMutation({
		onSuccess: async (data) => {
			if (data && 'id' in data) {
				await setSubscriberCookie(data)
			}
		},
	})
	const answerSurveyMultipleMutation =
		api.convertkit.answerSurveyMultiple.useMutation({
			onSuccess: async (data) => {
				if (data && 'id' in data) {
					await setSubscriberCookie(data)
				}
			},
		})
	const [email, setEmail] = React.useState<string | null>(null)

	const handleEmailSubmit = async (email: string) => {
		setEmail(email)
		sendToMachine({ type: 'EMAIL_COLLECTED' })

		// Submit all answers with the email
		answerSurveyMultipleMutation.mutate({
			email,
			answers,
			surveyId: TYPESCRIPT_2024_SURVEY_ID,
		})
	}

	React.useEffect(() => {
		// Fallback: submit if already complete without email submission
		if (
			isComplete &&
			machineState.matches('offerComplete') &&
			!email &&
			subscriber?.email_address
		) {
			answerSurveyMultipleMutation.mutate({
				email: subscriber.email_address,
				answers,
				surveyId: TYPESCRIPT_2024_SURVEY_ID,
			})
		}
	}, [
		isComplete,
		machineState,
		email,
		subscriber,
		answers,
		answerSurveyMultipleMutation,
	])

	return (
		<LayoutClient withContainer>
			<div className="relative flex min-h-[calc(100vh-var(--nav-height))] items-center justify-center">
				<div className="border-border flex min-h-[calc(100vh-var(--nav-height))] w-full max-w-2xl items-center justify-center border-x">
					{isLoading ? (
						<div className="py-10 text-center text-2xl">Loading survey...</div>
					) : !currentQuestion && !isPresenting ? (
						<div className="py-10 text-center text-2xl">
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
										surveyId: TYPESCRIPT_2024_SURVEY_ID,
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
			</div>
		</LayoutClient>
	)
}
