import { db } from '@/db'
import { inngest } from '@/inngest/inngest.server'
import { softDeleteEntitlementsForPurchase } from '@/lib/entitlements'
import { log } from '@/server/logger'

import { REFUND_PROCESSED_EVENT } from '@coursebuilder/core/inngest/commerce/event-refund-processed'

/**
 * Inngest function to handle refund events and soft delete entitlements
 * This function is triggered when a purchase is refunded and removes
 * the associated entitlements by setting the deletedAt timestamp
 */
export const refundEntitlements = inngest.createFunction(
	{
		id: 'refund-entitlements',
		name: 'Refund Entitlements',
	},
	{
		event: REFUND_PROCESSED_EVENT,
	},
	async ({ event, step, db: adapter }) => {
		const startTime = Date.now()
		const chargeId = event.data.stripeChargeId || event.data.merchantChargeId
		if (!chargeId) throw new Error('No chargeId provided')

		try {
			// Using the adapter's getPurchaseForStripeCharge method directly
			const purchase = await step.run(
				'get purchase for stripe charge',
				async () => {
					return adapter.getPurchaseForStripeCharge(chargeId)
				},
			)

			if (!purchase) {
				await log.warn('refund_entitlements.purchase_not_found', {
					stripeChargeId: chargeId,
					duration: Date.now() - startTime,
				})
				return {
					entitlementsDeleted: 0,
					reason: 'purchase_not_found',
					stripeChargeId: chargeId,
				}
			}

			if (!purchase.userId) {
				await log.warn('refund_entitlements.user_id_not_found', {
					purchaseId: purchase.id,
					stripeChargeId: chargeId,
					duration: Date.now() - startTime,
				})
				return {
					purchaseId: purchase.id,
					userId: null,
					entitlementsDeleted: 0,
					reason: 'user_id_not_found',
					stripeChargeId: chargeId,
				}
			}

			// Soft delete entitlements for this specific purchase
			const result = await step.run(
				'soft delete entitlements for purchase',
				async () => {
					return softDeleteEntitlementsForPurchase(purchase.id)
				},
			)

			await log.info('refund_entitlements.completed', {
				purchaseId: purchase.id,
				stripeChargeId: chargeId,
				userId: purchase.userId,
				entitlementsDeleted: result.rowsAffected || 0,
				duration: Date.now() - startTime,
			})

			return {
				purchaseId: purchase.id,
				userId: purchase.userId,
				entitlementsDeleted: result.rowsAffected || 0,
				reason: 'success',
				stripeChargeId: chargeId,
			}
		} catch (error) {
			await log.error('refund_entitlements.failed', {
				stripeChargeId: chargeId,
				error: error instanceof Error ? error.message : String(error),
				duration: Date.now() - startTime,
			})
			return {
				reason: 'error',
				stripeChargeId: chargeId,
				error: error instanceof Error ? error.message : String(error),
				entitlementsDeleted: 0,
			}
		}
	},
)
