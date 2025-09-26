import { db } from '@/db'
import { inngest } from '@/inngest/inngest.server'
import {
	isBulkPurchase,
	refundBulkPurchaseEntitlements,
} from '@/lib/bulk-purchase-refund'
import { softDeleteEntitlementsForPurchase } from '@/lib/entitlements'
import { log } from '@/server/logger'

import { REFUND_PROCESSED_EVENT } from '@coursebuilder/core/inngest/commerce/event-refund-processed'

/**
 * Inngest function to handle refund events and soft delete entitlements
 * This function is triggered when a purchase is refunded and removes
 * the associated entitlements by setting the deletedAt timestamp
 *
 * For bulk purchases, it removes entitlements for ALL team members who
 * claimed seats, not just the original purchaser
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

			// Check if this is a bulk purchase that affects multiple users
			const isBulk = isBulkPurchase(purchase)

			let result
			if (isBulk) {
				// Handle bulk purchase refund - affects all team members
				result = await step.run(
					'refund bulk purchase entitlements',
					async () => {
						return refundBulkPurchaseEntitlements(purchase)
					},
				)
			} else {
				// Handle individual purchase refund
				result = await step.run(
					'soft delete entitlements for purchase',
					async () => {
						return softDeleteEntitlementsForPurchase(purchase.id)
					},
				)
			}

			if (isBulk) {
				const bulkResult = result as any // Type assertion since we know it's from refundBulkPurchaseEntitlements

				await log.info('refund_entitlements.bulk_completed', {
					purchaseId: purchase.id,
					stripeChargeId: chargeId,
					userId: purchase.userId,
					isBulkPurchase: true,
					success: bulkResult.success || false,
					totalPurchasesRefunded: bulkResult.totalPurchasesRefunded || 0,
					totalEntitlementsRemoved: bulkResult.totalEntitlementsRemoved || 0,
					totalMembershipsRemoved: bulkResult.totalMembershipsRemoved || 0,
					affectedUsers: bulkResult.affectedUsers?.length || 0,
					duration: Date.now() - startTime,
				})

				return {
					purchaseId: purchase.id,
					userId: purchase.userId,
					isBulkPurchase: true,
					success: bulkResult.success || false,
					totalPurchasesRefunded: bulkResult.totalPurchasesRefunded || 0,
					entitlementsDeleted: bulkResult.totalEntitlementsRemoved || 0,
					membershipsRemoved: bulkResult.totalMembershipsRemoved || 0,
					affectedUsers: bulkResult.affectedUsers || [],
					reason: bulkResult.success ? 'success' : 'error',
					error: bulkResult.error || null,
					stripeChargeId: chargeId,
				}
			} else {
				const individualResult = result as any // Type assertion for individual result

				await log.info('refund_entitlements.individual_completed', {
					purchaseId: purchase.id,
					stripeChargeId: chargeId,
					userId: purchase.userId,
					isBulkPurchase: false,
					entitlementsDeleted: individualResult.rowsAffected || 0,
					duration: Date.now() - startTime,
				})

				return {
					purchaseId: purchase.id,
					userId: purchase.userId,
					isBulkPurchase: false,
					entitlementsDeleted: individualResult.rowsAffected || 0,
					reason: 'success',
					stripeChargeId: chargeId,
				}
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
