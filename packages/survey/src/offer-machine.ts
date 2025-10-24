// import {Subscriber} from '@skillrecordings/skill-lesson/schemas/subscriber'
import { isBefore, subDays } from 'date-fns'
import { assign, fromPromise, setup } from 'xstate'

import type { Offer, Subscriber } from './types'

export type OfferMachineEvent =
	| { type: 'SUBSCRIBER_LOADED'; subscriber: Subscriber }
	| { type: 'NO_SUBSCRIBER_FOUND' }
	| { type: 'OFFER_DISMISSED' }
	| { type: 'OFFER_CLOSED' }
	| { type: 'NOT_ELIGIBLE_FOR_OFFERS' }
	| { type: 'OFFER_ELIGIBILITY_VERIFIED' }
	| { type: 'CURRENT_OFFER_READY'; currentOffer: Offer; currentOfferId: string }
	| { type: 'NO_CURRENT_OFFER_FOUND' }
	| { type: 'RESPONDED_TO_OFFER' }
	| { type: 'POST_OFFER_CTA_AVAILABLE' }
	| { type: 'DISMISSAL_ACKNOWLEDGED' }
	| { type: 'OFFER_COMPLETE' }
	| { type: 'SUBSCRIBED' }
	| { type: 'EMAIL_COLLECTED' }

export type OfferContext = {
	subscriber?: Subscriber
	currentOffer: Offer
	currentOfferId: string
	canSurveyAnon?: boolean
	askAllQuestions?: boolean
	bypassNagProtection?: boolean
	surveyId?: string
	answers?: Record<string, string>
}

export type OfferMachineInput = Partial<OfferContext>

export const offerMachine = setup({
	types: {
		context: {} as OfferContext,
		events: {} as OfferMachineEvent,
		input: {} as OfferMachineInput,
	},
	actors: {
		verifyEligibility: fromPromise(
			async ({ input }: { input: OfferContext }) => {
				const { subscriber } = input

				if (!subscriber && input.canSurveyAnon) {
					return true
				}

				const lastSurveyDate = new Date(
					subscriber?.fields.last_surveyed_on || 0,
				)
				const DAYS_TO_WAIT_BETWEEN_QUESTIONS = 3
				const thresholdDate = subDays(
					new Date(),
					DAYS_TO_WAIT_BETWEEN_QUESTIONS,
				)

				const canSurvey =
					input.bypassNagProtection ||
					(isBefore(lastSurveyDate, thresholdDate) &&
						subscriber?.fields.do_not_survey !== 'true')

				if (canSurvey) {
					return true
				} else {
					throw new Error('Not eligible for survey')
				}
			},
		),
	},
	guards: {
		hasSubscriber: ({ context }) => Boolean(context.subscriber),
		shouldAskAllQuestions: ({ context }) => context.askAllQuestions === true,
	},
}).createMachine({
	id: 'offerMachine',
	initial: 'loadingSubscriber',
	context: ({ input }) => ({
		subscriber: input.subscriber,
		currentOffer: input.currentOffer || ({} as Offer),
		currentOfferId: input.currentOfferId || '',
		canSurveyAnon: input.canSurveyAnon,
		askAllQuestions: input.askAllQuestions,
		bypassNagProtection: input.bypassNagProtection,
		surveyId: input.surveyId,
		answers: input.answers,
	}),
	states: {
		loadingSubscriber: {
			on: {
				SUBSCRIBER_LOADED: {
					target: 'verifyingOfferEligibility',
					actions: assign({
						subscriber: ({ event }) => event.subscriber,
					}),
				},
				NO_SUBSCRIBER_FOUND: {
					target: 'verifyingOfferEligibility',
				},
			},
		},
		verifyingOfferEligibility: {
			invoke: {
				src: 'verifyEligibility',
				input: ({ context }) => context,
				onDone: { target: 'loadingCurrentOffer' },
				onError: { target: 'offerComplete' },
			},
			on: {
				NOT_ELIGIBLE_FOR_OFFERS: {
					target: 'offerComplete',
				},
				OFFER_ELIGIBILITY_VERIFIED: {
					target: 'loadingCurrentOffer',
				},
			},
		},
		loadingCurrentOffer: {
			on: {
				CURRENT_OFFER_READY: {
					target: 'presentingCurrentOffer',
					actions: assign({
						currentOffer: ({ event }) => {
							console.log('set currentOffer', event.currentOffer)
							return event.currentOffer
						},
						currentOfferId: ({ event }) => {
							console.log('set currentOfferId', event.currentOfferId)
							return event.currentOfferId
						},
					}),
				},
				NO_CURRENT_OFFER_FOUND: [
					{
						target: 'offerComplete',
						guard: 'hasSubscriber',
					},
					{
						target: 'collectEmail',
					},
				],
			},
		},
		presentingCurrentOffer: {
			on: {
				RESPONDED_TO_OFFER: [
					{
						target: 'loadingCurrentOffer',
						guard: 'shouldAskAllQuestions',
					},
					{
						target: 'offerComplete',
					},
				],
				OFFER_DISMISSED: {
					target: 'offerComplete',
				},
				OFFER_CLOSED: {
					target: 'offerComplete',
				},
			},
		},
		collectEmail: {
			on: {
				EMAIL_COLLECTED: {
					target: 'offerComplete',
				},
			},
		},
		offerComplete: {
			type: 'final',
		},
	},
})
