// import {useConvertkit} from '@skillrecordings/skill-lesson/hooks/use-convertkit'
// import { QuestionResource } from '@skillrecordings/types'
import * as React from 'react'
import { useMachine } from '@xstate/react'

import { offerMachine } from './offer-machine'
import { SurveyMachineContext } from './survey-machine'
import type { QuestionResource, QuizResource } from './types'

export const useSurveyPageOfferMachine = (
	surveyData: QuizResource,
	surveyId: string,
	subscriber: any,
	loadingSubscriber: boolean,
	options?: {
		initialAnswers?: Record<string, string>
		initialState?: string
	},
) => {
	// const {subscriber, loadingSubscriber} = useConvertkit()
	const [machineState, sendToMachine] = useMachine(offerMachine, {
		input: {
			canSurveyAnon: true,
			askAllQuestions: true,
			bypassNagProtection: true,
			surveyId,
			answers: options?.initialAnswers || {},
		},
	})

	const [answers, setAnswers] = React.useState<
		Record<string, string | string[]>
	>({})
	const availableQuestions = surveyData.questions

	React.useEffect(() => {
		if (process.env.NODE_ENV === 'development')
			console.debug('state:', machineState.value.toString())
		switch (true) {
			case machineState.matches('loadingSubscriber' as any):
				if (!loadingSubscriber) {
					sendToMachine({
						type: 'SUBSCRIBER_LOADED',
						subscriber: subscriber || null,
					})
				}
				break
			case machineState.matches('loadingCurrentOffer' as any):
				const questionKeys = Object.keys(availableQuestions)
				let currentIndex = questionKeys.indexOf(
					machineState.context.currentOfferId,
				)
				let nextIndex = currentIndex === -1 ? 0 : currentIndex + 1

				// Find next valid question
				while (nextIndex < questionKeys.length) {
					const nextQuestionId = questionKeys[nextIndex]
					const nextQuestion = availableQuestions[nextQuestionId]

					const dependencyMet =
						!nextQuestion.dependsOn ||
						((): boolean => {
							const storedAnswer = answers[nextQuestion.dependsOn.question]
							return Array.isArray(storedAnswer)
								? storedAnswer.includes(nextQuestion.dependsOn.answer)
								: storedAnswer === nextQuestion.dependsOn.answer
						})()

					if (dependencyMet) {
						const processedQuestion =
							typeof nextQuestion.question === 'function'
								? {
										...nextQuestion,
										question: nextQuestion.question(answers),
									}
								: nextQuestion

						sendToMachine({
							type: 'CURRENT_OFFER_READY',
							currentOffer: processedQuestion,
							currentOfferId: nextQuestionId,
						})
						return
					}

					nextIndex++
				}

				sendToMachine({ type: 'NO_CURRENT_OFFER_FOUND' })
				break
		}
	}, [
		subscriber,
		loadingSubscriber,
		machineState,
		sendToMachine,
		availableQuestions,
		answers,
	])

	const currentQuestion = machineState.context.currentOffer as QuestionResource
	const currentQuestionId = machineState.context.currentOfferId

	const handleSubmitAnswer = async (context: SurveyMachineContext) => {
		let answer = context.answer

		// If the question is an essay, the answer might be an empty string
		// In this case, we'll use the formik values
		if (currentQuestion.type === 'essay' && (!answer || answer === '')) {
			answer = context.answer
		}

		setAnswers((prev) => {
			return { ...prev, [context.currentQuestionId]: answer }
		})
	}

	return {
		currentQuestion,
		currentQuestionId,
		isLoading:
			machineState.matches('loadingSubscriber' as any) ||
			machineState.matches('loadingCurrentOffer' as any),
		isComplete: machineState.matches('offerComplete' as any),
		isPresenting: machineState.matches('presentingCurrentOffer' as any),
		sendToMachine,
		handleSubmitAnswer,
		machineState,
		subscriber,
		answers,
	}
}
