import { db } from '@/db'
import { inngest } from '@/inngest/inngest.server'
import { log } from '@/server/logger'

import { PARTIAL_REFUND_EVENT } from '../events/partial-refund'

type EligiblePurchase = {
	purchaseId: string
	userId: string
	email: string
	chargeId: string
}

export const partialRefundWorkflow = inngest.createFunction(
	{
		id: 'partial-refund-workflow',
		name: 'Partial Refund Workflow ($20)',
	},
	{
		event: PARTIAL_REFUND_EVENT,
	},
	async ({ event, step, paymentProvider }) => {
		const startTime = Date.now()

		// Get Stripe client from paymentProvider
		const stripe = (paymentProvider.options.paymentsAdapter as any).stripe

		await log.info('partial_refund.start', {})

		// Step 1: Load eligible purchases
		const candidates = await step.run('load-eligible-purchases', async () => {
			try {
				const { sql } = await import('drizzle-orm')
				const query = sql`
					SELECT DISTINCT
						p.id AS purchaseId,
						p.userId,
						u.email,
						mc.identifier AS chargeId
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

				await log.info('partial_refund.eligible_purchases_loaded', {
					count: purchases.length,
				})

				return purchases
			} catch (error) {
				await log.error('partial_refund.load_failed', {
					error: error instanceof Error ? error.message : String(error),
				})
				throw error
			}
		})

		if (!candidates.length) {
			await log.info('partial_refund.no_candidates_found', {})
			return {
				message: 'No eligible purchases found for partial refund.',
				totalCandidates: 0,
				success: [],
				skipped: [],
				failed: [],
			}
		}

		// Step 2: Process refunds, one per person
		type RefundResult = {
			status: 'success' | 'skipped' | 'failed'
			email: string
			reason?: string
			refundId?: string
		}
		const refundResults: RefundResult[] = []
		for (const [index, c] of candidates.entries()) {
			const result = await step.run(`refund-${c.chargeId}`, async () => {
				try {
					await log.info('partial_refund.processing_user', {
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
							reason: 'charge_not_found',
						}
					}

					if (charge.refunded || charge.amount_refunded >= charge.amount) {
						return {
							status: 'skipped' as const,
							email: c.email,
							reason: 'already_fully_refunded',
						}
					}

					const refunds = charge.refunds?.data ?? []
					const alreadyRefunded = refunds.some(
						(r: any) => r.status === 'succeeded' && r.amount === 2000,
					)

					if (alreadyRefunded) {
						return {
							status: 'skipped' as const,
							email: c.email,
							reason: 'partial_refund_already_applied',
						}
					}

					const refund = await stripe.refunds.create(
						{
							charge: c.chargeId,
							amount: 2000, // $20
							reason: 'requested_by_customer',
							metadata: {
								campaign: 'PARTIAL_REFUND_20',
								userId: c.userId,
								email: c.email,
								purchaseId: c.purchaseId,
							},
						},
						{ idempotencyKey: `partial20_${c.chargeId}` },
					)

					if (refund.status === 'succeeded') {
						await log.info('partial_refund.success', {
							email: c.email,
							userId: c.userId,
							refundId: refund.id,
						})
						return {
							status: 'success' as const,
							email: c.email,
							refundId: refund.id,
						}
					} else {
						await log.error('partial_refund.failed_status', {
							email: c.email,
							status: refund.status,
						})
						return {
							status: 'failed' as const,
							email: c.email,
							reason: `refund_status_${refund.status}`,
						}
					}
				} catch (error: unknown) {
					const message = error instanceof Error ? error.message : String(error)
					await log.error('partial_refund.refund_failed', {
						email: c.email,
						error: message,
					})
					return {
						status: 'failed' as const,
						email: c.email,
						reason: message,
					}
				}
			})
			refundResults.push(result)
		}

		// Step 3: Final summary
		const summary = await step.run('final-summary', async () => {
			const success = refundResults.filter((r) => r.status === 'success')
			const skipped = refundResults.filter((r) => r.status === 'skipped')
			const failed = refundResults.filter((r) => r.status === 'failed')

			const duration = Date.now() - startTime

			await log.info('partial_refund.completed', {
				durationMs: duration,
				totalCandidates: candidates.length,
				successCount: success.length,
				skippedCount: skipped.length,
				failedCount: failed.length,
			})

			return {
				totalCandidates: candidates.length,
				successCount: success.length,
				skippedCount: skipped.length,
				failedCount: failed.length,
				success: success.map((r) => r.email),
				skipped: skipped.map((r) => ({ email: r.email, reason: r.reason })),
				failed: failed.map((r) => ({ email: r.email, reason: r.reason })),
				durationMs: duration,
			}
		})

		return {
			message: `Partial refund complete: ${summary.successCount} succeeded, ${summary.skippedCount} skipped, ${summary.failedCount} failed.`,
			...summary,
		}
	},
)
