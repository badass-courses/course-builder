'use client'

import React from 'react'
import Spinner from '@/components/spinner'
import { api } from '@/trpc/react'

import { useSurveyPageOfferMachine } from '@coursebuilder/survey'
import type {
	QuestionResource,
	QuizResource,
	SurveyConfig,
} from '@coursebuilder/survey/types'

import { setSubscriberCookie } from '../../(content)/survey/actions'
import { SurveyRenderer } from '../survey-renderer'

type SurveyPageClientProps = {
	quizResource: QuizResource
	surveyConfig: SurveyConfig
	surveyId: string
}

export function SurveyPageClient({
	quizResource,
	surveyConfig,
	surveyId,
}: SurveyPageClientProps) {
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
		quizResource,
		surveyId,
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
			surveyId: surveyId,
		})
	}

	const hasSubmittedRef = React.useRef(false)

	// Reset submission flag when survey changes
	React.useEffect(() => {
		hasSubmittedRef.current = false
	}, [surveyId])

	React.useEffect(() => {
		// Fallback: submit if already complete without email submission
		if (
			isComplete &&
			machineState.matches('offerComplete') &&
			!email &&
			subscriber?.email_address &&
			!hasSubmittedRef.current
		) {
			hasSubmittedRef.current = true
			answerSurveyMultipleMutation.mutate({
				email: subscriber.email_address,
				answers,
				surveyId: surveyId,
			})
		}
	}, [isComplete, machineState, email, subscriber, answers, surveyId])

	if (isLoading) {
		return (
			<div className="flex items-center justify-center gap-3 py-10 text-center text-lg">
				<Spinner className="size-5" />{' '}
				<span className="">
					Loading survey<span className="animate-pulse">...</span>
				</span>
			</div>
		)
	}

	if (!currentQuestion && !isPresenting) {
		return (
			<div className="flex items-center justify-center py-10 text-center text-2xl">
				No survey available at this time.
			</div>
		)
	}

	return (
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
						surveyId: surveyId,
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
	)
}
