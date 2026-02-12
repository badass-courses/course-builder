import { inngest } from '@/inngest/inngest.server'
import { createShortlinkAttribution } from '@/lib/shortlink-attribution'
import { log } from '@/server/logger'

import { NEW_PURCHASE_CREATED_EVENT } from '@coursebuilder/core/inngest/commerce/event-new-purchase-created'

/**
 * Records shortlink attribution for ALL purchase types.
 *
 * This is a dedicated, unfiltered handler that runs for every new purchase
 * regardless of product type (cohort, self-paced, live, etc.).
 *
 * Keeps attribution logic in one place instead of duplicating across
 * product-type-specific workflows.
 */
export const shortlinkAttribution = inngest.createFunction(
	{
		id: 'shortlink-attribution',
		name: 'Record Shortlink Attribution',
		idempotency: 'event.data.purchaseId',
	},
	{ event: NEW_PURCHASE_CREATED_EVENT },
	async ({ event, step, db: adapter, paymentProvider }) => {
		const checkoutSessionId = event.data.checkoutSessionId
		if (!checkoutSessionId || !paymentProvider) {
			return {
				skipped: true,
				reason: 'No checkout session or payment provider',
			}
		}

		const purchase = await step.run('get purchase', async () => {
			return adapter.getPurchase(event.data.purchaseId)
		})

		if (!purchase) {
			return { skipped: true, reason: 'Purchase not found' }
		}

		const product = await step.run('get product', async () => {
			return adapter.getProduct(purchase.productId as string)
		})

		const user = await step.run('get user', async () => {
			return adapter.getUserById(purchase.userId as string)
		})

		if (!user) {
			return { skipped: true, reason: 'User not found' }
		}

		const result = await step.run('record attribution', async () => {
			try {
				const checkoutSession =
					await paymentProvider.options.paymentsAdapter.getCheckoutSession(
						checkoutSessionId,
					)

				const shortlinkRef = checkoutSession.metadata?.shortlinkRef

				if (!shortlinkRef) {
					await log.info('shortlink.attribution.no_ref_in_metadata', {
						checkoutSessionId,
						purchaseId: purchase.id,
						productId: product?.id,
						productType: event.data.productType,
						metadata: checkoutSession.metadata,
					})
					return { skipped: true, reason: 'No shortlink reference in metadata' }
				}

				await log.info('shortlink.attribution.found_ref', {
					checkoutSessionId,
					shortlinkRef,
					purchaseId: purchase.id,
					productId: product?.id,
					productType: event.data.productType,
				})

				await createShortlinkAttribution({
					shortlinkSlug: shortlinkRef,
					email: user.email,
					userId: user.id,
					type: 'purchase',
					metadata: {
						productId: product?.id,
						productName: product?.name,
						purchaseId: purchase.id,
						totalAmount: purchase.totalAmount,
						productType: event.data.productType,
					},
				})

				await log.info('shortlink.attribution.recorded', {
					shortlinkRef,
					purchaseId: purchase.id,
					productType: event.data.productType,
				})

				return {
					recorded: true,
					shortlinkRef,
					userId: user.id,
				}
			} catch (error: any) {
				await log.warn('shortlink.attribution.error', {
					checkoutSessionId,
					purchaseId: purchase.id,
					error: error.message,
				})
				return { error: error.message }
			}
		})

		return result
	},
)
