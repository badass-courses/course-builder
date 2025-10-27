import { emailListProvider } from '@/coursebuilder/email-list-provider'
import { inngest } from '@/inngest/inngest.server'
import type { Subscriber } from '@/schemas/subscriber'
import { log } from '@/server/logger'

/**
 * Updates a subscriber custom field with the provided survey answer.
 * Use for learner/customer activity only (not internal ops).
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
		if (!subscriber?.id || !subscriber?.email_address) {
			return { error: 'Missing subscriber identifiers' }
		}
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
		log.error('answerSurvey failed', {
			err: (error as Error)?.message,
			subscriberId: subscriber?.id,
			question,
		})
		return { error: 'Failed to update subscriber fields' }
	}
}
