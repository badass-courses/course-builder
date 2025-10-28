'use client'

import React from 'react'
import Spinner from '@/components/spinner'
import { useConvertkitSubscriberUrlParam } from '@/hooks/use-convertkit-subscriber-url-param'
import { setSubscriberCookie } from '@/lib/convertkit'
import { api } from '@/trpc/react'

import { useSurveyPageOfferMachine } from '@coursebuilder/survey'
import type {
	QuestionResource,
	QuizResource,
	SurveyConfig,
} from '@coursebuilder/survey/types'

import { SurveyRenderer } from './survey-renderer'

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
	const cookieReady = useConvertkitSubscriberUrlParam()

	const { data: subscriberData, status } =
		api.ability.getCurrentSubscriberFromCookie.useQuery(undefined, {
			enabled: cookieReady,
		})

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
	const hasSubmittedRef = React.useRef(false)

	const handleEmailSubmit = async (email: string) => {
		setEmail(email)
		hasSubmittedRef.current = true
		sendToMachine({ type: 'EMAIL_COLLECTED' })

		// Submit all answers from the machine context
		answerSurveyMultipleMutation.mutate({
			email,
			answers: machineState.context.answers || {},
			surveyId: surveyId,
		})
	}

	// Reset submission flag when survey changes
	React.useEffect(() => {
		hasSubmittedRef.current = false
	}, [surveyId])

	React.useEffect(() => {
		// Fallback: only for authenticated users who didn't go through email collection
		// (their answers were already written per-question, just update completion timestamp)
		if (
			isComplete &&
			machineState.matches('offerComplete') &&
			!email &&
			subscriber?.email_address &&
			!hasSubmittedRef.current
		) {
			hasSubmittedRef.current = true
			// Just update the completion timestamp in ConvertKit, don't write answers again
			answerSurveyMultipleMutation.mutate({
				email: subscriber.email_address,
				answers: {}, // Empty - answers already written per-question
				surveyId: surveyId,
			})
		}
	}, [isComplete, machineState, email, subscriber, surveyId])

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
				// Only write per-question for authenticated users with subscriber
				if (subscriber?.email_address) {
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
