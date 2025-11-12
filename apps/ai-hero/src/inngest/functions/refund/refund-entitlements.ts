import { db } from '@/db'
import { inngest } from '@/inngest/inngest.server'
import {
	isBulkPurchase,
	refundBulkPurchaseEntitlements,
} from '@/lib/bulk-purchase-refund'
import {
	getCreditEntitlementsForSourcePurchase,
	softDeleteCreditEntitlements,
	softDeleteEntitlementsForPurchase,
} from '@/lib/entitlements'
import { log } from '@/server/logger'

import { REFUND_PROCESSED_EVENT } from '@coursebuilder/core/inngest/commerce/event-refund-processed'

type CreditRefundResult =
	| {
			type: 'source'
			sourcePurchase: {
				creditsFound: number
				unusedCreditsRevoked: number
				usedCreditsFound: number
				creditEntitlementIds: string[]
				usedCreditEntitlementIds: string[]
				financialLoss: boolean
				financialLossMessage: string
			}
	  }
	| {
			type: 'none'
			reason?: string
	  }

/**
 * Handle credit entitlements refund for both source and target purchases
 * @param purchase - The purchase being refunded
 * @returns Object with credit refund details
 */
async function handleCreditEntitlementsRefund(
	purchase: any,
): Promise<CreditRefundResult> {
	if (!purchase.userId || !purchase.productId) {
		return {
			type: 'none',
			reason: 'Missing userId or productId',
		}
	}

	// Check if this is a SOURCE purchase (granted credits)
	// Find credit entitlements that were granted by THIS SPECIFIC purchase/product
	// Note: This only returns credits attached to this product (via eligibilityProductId),
	// not all credits the user has from other products
	const sourceCredits = await getCreditEntitlementsForSourcePurchase(
		purchase.productId,
		purchase.userId,
	)

	if (sourceCredits.length === 0) {
		return {
			type: 'none',
		}
	}

	const result: CreditRefundResult = {
		type: 'source',
		sourcePurchase: {
			creditsFound: sourceCredits.length,
			unusedCreditsRevoked: 0,
			usedCreditsFound: 0,
			creditEntitlementIds: [],
			usedCreditEntitlementIds: [],
			financialLoss: false,
			financialLossMessage: '',
		},
	}

	const unusedCredits = sourceCredits.filter((credit) => !credit.deletedAt)
	const usedCredits = sourceCredits.filter((credit) => credit.deletedAt)

	if (unusedCredits.length > 0) {
		const unusedIds = unusedCredits.map((c) => c.id)
		const deleteResult = await softDeleteCreditEntitlements(unusedIds)

		result.sourcePurchase.unusedCreditsRevoked = deleteResult.rowsAffected || 0
		result.sourcePurchase.creditEntitlementIds = unusedIds

		await log.info('refund_entitlements.source_unused_credits_revoked', {
			purchaseId: purchase.id,
			userId: purchase.userId,
			productId: purchase.productId,
			unusedCreditsRevoked: result.sourcePurchase.unusedCreditsRevoked,
			creditEntitlementIds: unusedIds,
			message: `Revoked ${unusedIds.length} unused credit(s) granted by product ${purchase.productId} only`,
		})
	}

	if (usedCredits.length > 0) {
		result.sourcePurchase.usedCreditsFound = usedCredits.length
		result.sourcePurchase.usedCreditEntitlementIds = usedCredits.map(
			(c) => c.id,
		)

		const logData = {
			purchaseId: purchase.id,
			userId: purchase.userId,
			productId: purchase.productId,
			usedCreditsFound: usedCredits.length,
			creditEntitlementIds: usedCredits.map((c) => c.id),
			message:
				'Credit was used - cannot revoke, financial loss recorded. Credit was used to purchase another product.',
			financialLoss: true,
		}

		await log.warn(
			'refund_entitlements.source_used_credits_cannot_revoke',
			logData,
		)

		result.sourcePurchase.financialLoss = true
		result.sourcePurchase.financialLossMessage = logData.message
	}

	return result
}

/**
 * Inngest function to handle refund events and soft delete entitlements
 * This function is triggered when a purchase is refunded and removes
 * the associated entitlements by setting the deletedAt timestamp
 *
 * For bulk purchases, it removes entitlements for ALL team members who
 * claimed seats, not just the original purchaser
 *
 */
export const refundEntitlements = inngest.createFunction(
	{
		id: 'refund-entitlements',
		name: 'Refund Entitlements',
	},
	{
		event: REFUND_PROCESSED_EVENT,
	},
	async ({ event, step, db: adapter, paymentProvider }) => {
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

			const creditRefundResult = await step.run(
				'handle credit entitlements refund',
				async () => {
					try {
						const result = await handleCreditEntitlementsRefund(purchase)

						if (
							result.type === 'source' &&
							'sourcePurchase' in result &&
							result.sourcePurchase.usedCreditsFound > 0
						) {
							return {
								...result,
								summary: `Loss: ${result.sourcePurchase.usedCreditsFound} credit(s) were used and cannot be revoked. ${result.sourcePurchase.financialLossMessage}`,
								financialLossDetails: {
									creditsUsed: result.sourcePurchase.usedCreditsFound,
									creditEntitlementIds:
										result.sourcePurchase.usedCreditEntitlementIds,
									message: result.sourcePurchase.financialLossMessage,
									cannotRevoke: true,
								},
							}
						}

						if (
							result.type === 'source' &&
							'sourcePurchase' in result &&
							result.sourcePurchase.unusedCreditsRevoked > 0
						) {
							return {
								...result,
								summary: `Revoked ${result.sourcePurchase.unusedCreditsRevoked} unused credit(s) for product ${purchase.productId}`,
							}
						}

						return result
					} catch (error) {
						await log.error('refund_entitlements.credit_handling_failed', {
							purchaseId: purchase.id,
							userId: purchase.userId,
							error: error instanceof Error ? error.message : String(error),
							message:
								'Credit entitlement handling failed, but main refund will continue',
						})
						return {
							type: 'none' as const,
							error: error instanceof Error ? error.message : String(error),
							summary: 'Credit handling failed - check logs for details',
						}
					}
				},
			)

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
					creditRefund: creditRefundResult,
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
					creditRefund: creditRefundResult,
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
					creditRefund: creditRefundResult,
					duration: Date.now() - startTime,
				})

				return {
					purchaseId: purchase.id,
					userId: purchase.userId,
					isBulkPurchase: false,
					entitlementsDeleted: individualResult.rowsAffected || 0,
					creditRefund: creditRefundResult,
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
