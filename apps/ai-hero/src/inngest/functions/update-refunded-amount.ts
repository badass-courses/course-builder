import { db } from '@/db'
import { inngest } from '@/inngest/inngest.server'
import { log } from '@/server/logger'

import { UPDATE_REFUNDED_AMOUNT_EVENT } from '../events/update-refunded-amount'

type EligiblePurchase = {
	purchaseId: string
	userId: string
	email: string
	chargeId: string
	totalAmount: string
}

export const updateRefundedAmountWorkflow = inngest.createFunction(
	{
		id: 'update-refunded-amount-workflow',
		name: 'Update Refunded Amount',
	},
	{
		event: UPDATE_REFUNDED_AMOUNT_EVENT,
	},
	async ({ event, step, paymentProvider }) => {
		const startTime = Date.now()

		// Get Stripe client from paymentProvider
		const stripe = (paymentProvider.options.paymentsAdapter as any).stripe

		await log.info('update_refunded_amount.start', {})

		// Step 1: Load eligible purchases (same as partial refund)
		const candidates = await step.run('load-eligible-purchases', async () => {
			try {
				const { sql } = await import('drizzle-orm')
				const query = sql`
					SELECT DISTINCT
						p.id AS purchaseId,
						p.userId,
						u.email,
						mc.identifier AS chargeId,
						p.totalAmount
					FROM AI_Purchase p
					JOIN AI_User u ON u.id = p.userId
					JOIN AI_MerchantCharge mc ON mc.id = p.merchantChargeId
					WHERE p.productId = 'product-9wdta'
						AND p.status = 'Valid'
						AND p.totalAmount > 98
						AND p.userId IN (
							SELECT userId
							FROM AI_Purchase
							WHERE productId IN ('product-3vfob', 'product-9wdta')
							GROUP BY userId
							HAVING COUNT(DISTINCT productId) = 2
						)
						AND p.merchantChargeId IS NOT NULL
				`
				const result = await db.execute(query)
				const purchases = result.rows as EligiblePurchase[]

				await log.info('update_refunded_amount.eligible_purchases_loaded', {
					count: purchases.length,
				})

				return purchases
			} catch (error) {
				await log.error('update_refunded_amount.load_failed', {
					error: error instanceof Error ? error.message : String(error),
				})
				throw error
			}
		})

		if (!candidates.length) {
			await log.info('update_refunded_amount.no_candidates_found', {})
			return {
				message: 'No eligible purchases found.',
				totalCandidates: 0,
				updated: [],
				skipped: [],
				failed: [],
			}
		}

		// Step 2: Check Stripe for refunds and update database
		type UpdateResult = {
			status: 'updated' | 'skipped' | 'failed'
			email: string
			purchaseId: string
			oldAmount: string
			newAmount?: string
			reason?: string
		}
		const updateResults: UpdateResult[] = []

		for (const [index, c] of candidates.entries()) {
			const result = await step.run(
				`check-and-update-${c.purchaseId}`,
				async () => {
					try {
						await log.info('update_refunded_amount.processing_user', {
							index: index + 1,
							total: candidates.length,
							email: c.email,
							userId: c.userId,
							purchaseId: c.purchaseId,
						})

						const charge = await stripe.charges.retrieve(c.chargeId, {
							expand: ['refunds'],
						})

						if (!charge) {
							return {
								status: 'failed' as const,
								email: c.email,
								purchaseId: c.purchaseId,
								oldAmount: c.totalAmount,
								reason: 'charge_not_found',
							}
						}

						// Check if there's a partial refund
						const refunds = charge.refunds?.data ?? []
						const partialRefund = refunds.find(
							(r: any) => r.status === 'succeeded' && r.amount === 2000,
						)

						if (!partialRefund) {
							return {
								status: 'skipped' as const,
								email: c.email,
								purchaseId: c.purchaseId,
								oldAmount: c.totalAmount,
								reason: 'no_partial_refund_found',
							}
						}

						// Calculate new amount (subtract $20)
						const currentAmount = parseFloat(c.totalAmount)
						const newAmount = (currentAmount - 20).toFixed(2)

						// Update the database
						const { sql } = await import('drizzle-orm')
						const updateQuery = sql`
						UPDATE AI_Purchase
						SET totalAmount = ${newAmount}
						WHERE id = ${c.purchaseId}
					`
						await db.execute(updateQuery)

						await log.info('update_refunded_amount.success', {
							email: c.email,
							userId: c.userId,
							purchaseId: c.purchaseId,
							oldAmount: c.totalAmount,
							newAmount,
						})

						return {
							status: 'updated' as const,
							email: c.email,
							purchaseId: c.purchaseId,
							oldAmount: c.totalAmount,
							newAmount,
						}
					} catch (error: unknown) {
						const message =
							error instanceof Error ? error.message : String(error)
						await log.error('update_refunded_amount.update_failed', {
							email: c.email,
							error: message,
						})
						return {
							status: 'failed' as const,
							email: c.email,
							purchaseId: c.purchaseId,
							oldAmount: c.totalAmount,
							reason: message,
						}
					}
				},
			)
			updateResults.push(result)
		}

		// Step 3: Final summary
		const summary = await step.run('final-summary', async () => {
			const updated = updateResults.filter((r) => r.status === 'updated')
			const skipped = updateResults.filter((r) => r.status === 'skipped')
			const failed = updateResults.filter((r) => r.status === 'failed')

			const duration = Date.now() - startTime

			await log.info('update_refunded_amount.completed', {
				durationMs: duration,
				totalCandidates: candidates.length,
				updatedCount: updated.length,
				skippedCount: skipped.length,
				failedCount: failed.length,
			})

			return {
				totalCandidates: candidates.length,
				updatedCount: updated.length,
				skippedCount: skipped.length,
				failedCount: failed.length,
				updated: updated.map((r) => ({
					email: r.email,
					purchaseId: r.purchaseId,
					oldAmount: r.oldAmount,
					newAmount: r.newAmount,
				})),
				skipped: skipped.map((r) => ({
					email: r.email,
					reason: r.reason,
				})),
				failed: failed.map((r) => ({
					email: r.email,
					reason: r.reason,
				})),
				durationMs: duration,
			}
		})

		return {
			message: `Update complete: ${summary.updatedCount} updated, ${summary.skippedCount} skipped, ${summary.failedCount} failed.`,
			...summary,
		}
	},
)
