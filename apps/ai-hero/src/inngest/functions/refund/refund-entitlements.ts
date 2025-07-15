import { db } from '@/db'
import { purchases } from '@/db/schema'
import { inngest } from '@/inngest/inngest.server'
import { softDeleteEntitlementsForPurchase } from '@/lib/entitlements'
import { log } from '@/server/logger'
import { eq } from 'drizzle-orm'

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
	async ({ event, step }) => {
		const startTime = Date.now()

		try {
			// Get the purchase associated with the merchant charge
			const purchase = await step.run(
				'get purchase for merchant charge',
				async () => {
					return db.query.purchases.findFirst({
						where: eq(purchases.merchantChargeId, event.data.merchantChargeId),
					})
				},
			)

			if (!purchase) {
				await log.warn('refund_entitlements.purchase_not_found', {
					merchantChargeId: event.data.merchantChargeId,
					duration: Date.now() - startTime,
				})
				return { entitlementsDeleted: 0 }
			}

			if (!purchase.userId) {
				await log.warn('refund_entitlements.user_id_not_found', {
					purchaseId: purchase.id,
					merchantChargeId: event.data.merchantChargeId,
					duration: Date.now() - startTime,
				})
				return { purchaseId: purchase.id, userId: null, entitlementsDeleted: 0 }
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
				merchantChargeId: event.data.merchantChargeId,
				userId: purchase.userId,
				entitlementsDeleted: result.rowsAffected || 0,
				duration: Date.now() - startTime,
			})

			return {
				purchaseId: purchase.id,
				userId: purchase.userId,
				entitlementsDeleted: result.rowsAffected || 0,
			}
		} catch (error) {
			await log.error('refund_entitlements.failed', {
				merchantChargeId: event.data.merchantChargeId,
				error: error instanceof Error ? error.message : String(error),
				duration: Date.now() - startTime,
			})
			throw error
		}
	},
)
