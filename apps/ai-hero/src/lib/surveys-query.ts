import { emailListProvider } from '@/coursebuilder/email-list-provider'
import { inngest } from '@/inngest/inngest.server'
import type { Subscriber } from '@/schemas/subscriber'

/**
 * updates a custom field on email list with the current date/time
 * when a learner completes a survey
 *
 * @param subscriber
 * @param question
 * @param answer
 */
export const answerSurvey = async ({
	subscriber,
	question,
	answer,
}: {
	subscriber: Subscriber
	question: string
	answer: string
}) => {
	try {
		if (emailListProvider.updateSubscriberFields) {
			const response = await emailListProvider.updateSubscriberFields({
				subscriberId: subscriber.id.toString(),
				subscriberEmail: subscriber.email_address,
				fields: {
					[question]: answer,
				},
			})

			return response
		} else {
			return { error: 'updateSubscriberFields is not supported' }
		}
	} catch (error) {
		return { error: 'Failed to update subscriber fields' }
	}
}
