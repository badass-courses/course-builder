import type { CourseBuilderAdapter } from '../../adapters'
import { logger } from '../utils/logger'

/**
 * Checks if a Stripe payment was successful but Inngest failed to create the purchase record
 * This happens when Inngest is down or experiencing issues
 */
export async function checkPaymentStatusWithoutPurchase(
	sessionId: string,
	adapter: CourseBuilderAdapter,
): Promise<{
	hasSuccessfulPayment: boolean
	hasPurchaseRecord: boolean
	stripeEventId?: string
	errorMessage?: string
}> {
	try {
		const merchantAccount = await adapter.getMerchantAccount({
			provider: 'stripe',
		})

		if (!merchantAccount) {
			return {
				hasSuccessfulPayment: false,
				hasPurchaseRecord: false,
				errorMessage: 'No merchant account found',
			}
		}

		const events = await adapter.getMerchantEventsByAccount(merchantAccount.id)

		const checkoutEvents = events.filter(
			(event: any) => event.payload?.type === 'checkout.session.completed',
		)

		const matchingEvent = checkoutEvents.find(
			(event: any) => event.payload?.data?.object?.id === sessionId,
		)

		if (matchingEvent) {
			const purchase = await adapter.getPurchaseForStripeCharge(
				matchingEvent.payload?.data?.object?.payment_intent,
			)

			return {
				hasSuccessfulPayment: true,
				hasPurchaseRecord: !!purchase,
				stripeEventId: matchingEvent.identifier,
			}
		}

		return {
			hasSuccessfulPayment: false,
			hasPurchaseRecord: false,
		}
	} catch (error) {
		logger.error(error as Error)
		return {
			hasSuccessfulPayment: false,
			hasPurchaseRecord: false,
			errorMessage: 'Error checking payment status',
		}
	}
}
