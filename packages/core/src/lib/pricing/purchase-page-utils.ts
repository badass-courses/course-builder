import type { CourseBuilderAdapter } from '../../adapters'
import { checkPaymentStatusWithoutPurchase } from './payment-status-checker'

/**
 * Simple utility to check if we should show error message instead of 404
 * when payment succeeded but Inngest failed to create purchase record.
 *
 * This should be used by ALL apps' purchase pages.
 */
export async function checkForPaymentSuccessWithoutPurchase(
	sessionId: string,
	courseBuilderAdapter: CourseBuilderAdapter,
) {
	const paymentStatus = await checkPaymentStatusWithoutPurchase(
		sessionId,
		courseBuilderAdapter,
	)

	if (paymentStatus.hasSuccessfulPayment && !paymentStatus.hasPurchaseRecord) {
		return {
			shouldShowError: true,
			stripeEventId: paymentStatus.stripeEventId,
		}
	}

	return {
		shouldShowError: false,
	}
}
