import * as React from 'react'
// import { useConvertkit } from '@skillrecordings/skill-lesson/hooks/use-convertkit'
import { useMachine } from '@xstate/react'
import isEmpty from 'lodash/isEmpty'

import { offerMachine } from './offer-machine'
import type { QuizResource, Subscriber } from './types'

export const useSurveyPopupOfferMachine = (
	surveyData: QuizResource,
	offerId: string = 'ask',
	subscriber: Subscriber,
	loadingSubscriber: boolean,
) => {
	// const {subscriber, loadingSubscriber} = useConvertkit()
	const [machineState, sendToMachine] = useMachine(offerMachine, {
		input: {},
	})

	const availableQuestions = surveyData.questions

	React.useEffect(() => {
		if (process.env.NODE_ENV === 'development')
			console.debug('state:', machineState.value.toString())
		switch (true) {
			case machineState.matches('loadingSubscriber' as any):
				// relies on another hook and using react-query under the hood
				if (subscriber && !loadingSubscriber) {
					sendToMachine({ type: 'SUBSCRIBER_LOADED', subscriber })
				} else if (!subscriber && !loadingSubscriber) {
					sendToMachine({ type: 'NO_SUBSCRIBER_FOUND' })
				}
				break
			case machineState.matches('loadingCurrentOffer' as any):
				// will rely on a hook and use trpc/react-query
				let offerFound = false
				for (const question in availableQuestions) {
					if (subscriber && isEmpty(subscriber.fields[question])) {
						sendToMachine({
							type: 'CURRENT_OFFER_READY',
							currentOffer: availableQuestions[question],
							currentOfferId: question,
						})
						offerFound = true
						break
					}
				}
				if (
					!offerFound &&
					subscriber &&
					subscriber.fields['ts_at_work'] === 'true'
				) {
					const devs_on_team = {
						question: `How many TypeScript developers are on your team?`,
						type: 'multiple-choice',
						choices: [
							{
								answer: '1',
								label: 'Just me!',
							},
							{
								answer: '2-5',
								label: '2-5',
							},
							{
								answer: '6-10',
								label: '6-10',
							},
							{
								answer: '10+',
								label: 'more than 10',
							},
						],
					}
					sendToMachine({
						type: 'CURRENT_OFFER_READY',
						currentOffer: devs_on_team,
						currentOfferId: `devs_on_team`,
					})
					offerFound = true
				}

				if (!offerFound) sendToMachine({ type: 'NO_CURRENT_OFFER_FOUND' })
				break
		}
	}, [
		subscriber,
		loadingSubscriber,
		machineState,
		sendToMachine,
		availableQuestions,
	])

	return {
		currentOfferId: machineState.context.currentOfferId,
		currentOffer: machineState.context.currentOffer,
		isPopupOpen: machineState.matches('presentingCurrentOffer' as any),
		sendToMachine,
		machineState,
	}
}
