import { Axiom } from '@axiomhq/js'
import { Redis } from '@upstash/redis'
import { PaymentsAdapter } from 'src/types'
import { Stripe } from 'stripe'

import { CheckoutSessionMetadata } from '../../schemas/stripe/checkout-session-metadata'
import {
	SubscriptionInfo,
	SubscriptionStatus,
} from '../../schemas/subscription-info'
import { logger } from '../utils/logger'
import { StripeCacheClient } from './stripe-cache'

export type SyncLog = {
	customerId: string
	operation: 'sync' | 'retry' | 'recovery'
	duration: number
	status: 'success' | 'failure'
	errorCode?: string
	retryCount: number
	source: 'webhook' | 'success-page' | 'manual' | string
}

export async function syncStripeDataToKV(params: {
	stripe: PaymentsAdapter
	redis?: Redis
	customerId: string
	source: SyncLog['source']
	retryCount?: number
	axiom?: Axiom
}): Promise<{
	log: SyncLog
	subscriptionInfo: SubscriptionInfo | null
}> {
	if (!params.redis) {
		throw new Error('Redis is required')
	}

	const startTime = Date.now()
	const cache = new StripeCacheClient(params.redis, params.axiom)
	const retryCount = params.retryCount || 0

	logger.debug('Starting subscription sync', {
		customerId: params.customerId,
		source: params.source,
		retryCount,
	})

	try {
		// 1. Get customer and subscription data
		logger.debug('Fetching customer data', { customerId: params.customerId })
		const customer = await params.stripe.getCustomer(params.customerId, [
			'subscriptions.data.items.data.price.product',
		])

		if (!('subscriptions' in customer)) {
			throw new Error('Invalid customer object')
		}

		const subscription = customer.subscriptions?.data[0] as
			| Stripe.Subscription
			| undefined
		const item = subscription?.items.data[0]
		const product = item?.price?.product as Stripe.Product | undefined

		logger.debug('Retrieved customer data', {
			customerId: params.customerId,
			hasSubscription: !!subscription,
			subscriptionId: subscription?.id,
			productId: product?.id,
		})

		// 2. Build subscription info
		const subscriptionInfo =
			subscription && item?.price && product
				? {
						customerIdentifier: customer.id,
						email: customer.email,
						name: customer.name,
						productIdentifier: product.id,
						product,
						subscriptionIdentifier: subscription.id,
						priceIdentifier: item.price.id,
						quantity: item.quantity || 1,
						status: subscription.status as SubscriptionStatus,
						currentPeriodStart: new Date(
							subscription.current_period_start * 1000,
						),
						currentPeriodEnd: new Date(subscription.current_period_end * 1000),
						metadata: {
							bulk: (subscription.metadata.bulk as 'true' | 'false') || 'false',
							country: subscription.metadata.country || 'US',
							ip_address: subscription.metadata.ip_address || '',
							productId: product.id,
							product: product.name || '',
							siteName: subscription.metadata.siteName || 'ai-hero',
							organizationId: subscription.metadata.organizationId,
							upgradeFromPurchaseId:
								subscription.metadata.upgradeFromPurchaseId,
							appliedPPPStripeCouponId:
								subscription.metadata.appliedPPPStripeCouponId,
							upgradedFromPurchaseId:
								subscription.metadata.upgradedFromPurchaseId,
							usedCouponId: subscription.metadata.usedCouponId,
							userId: subscription.metadata.userId,
						} as CheckoutSessionMetadata,
					}
				: null

		logger.debug('Built subscription info', {
			customerId: params.customerId,
			subscriptionId: subscriptionInfo?.subscriptionIdentifier,
			status: subscriptionInfo?.status,
			metadata: subscriptionInfo?.metadata,
		})

		// 3. Update Redis cache
		if (subscriptionInfo && subscription) {
			logger.debug('Updating Redis cache', {
				customerId: params.customerId,
				subscriptionId: subscriptionInfo.subscriptionIdentifier,
			})

			await cache.setSubscriptionState(params.customerId, {
				subscriptionId: subscriptionInfo.subscriptionIdentifier,
				status: subscriptionInfo.status,
				priceId: subscriptionInfo.priceIdentifier,
				currentPeriodEnd: subscription.current_period_end,
				organizationId: subscription.metadata.organizationId || '',
				metadata: subscription.metadata,
				lastSyncedAt: Date.now(),
				syncAttempts: retryCount,
			})

			logger.debug('Redis cache updated', {
				customerId: params.customerId,
				duration: Date.now() - startTime,
			})
		} else {
			logger.debug('Deleting subscription state', {
				customerId: params.customerId,
			})
			await cache.deleteSubscriptionState(params.customerId)
		}

		const duration = Date.now() - startTime
		logger.debug('Sync completed successfully', {
			customerId: params.customerId,
			duration,
			source: params.source,
		})

		return {
			log: {
				customerId: params.customerId,
				operation: retryCount > 0 ? 'retry' : 'sync',
				duration,
				status: 'success',
				retryCount,
				source: params.source,
			},
			subscriptionInfo,
		}
	} catch (error) {
		const errorCode = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
		const duration = Date.now() - startTime

		logger.error(error instanceof Error ? error : new Error(errorCode))
		logger.debug('Sync failed', {
			customerId: params.customerId,
			duration,
			errorCode,
			source: params.source,
		})

		// Increment sync attempts on failure
		await cache.incrementSyncAttempts(params.customerId)

		return {
			log: {
				customerId: params.customerId,
				operation: retryCount > 0 ? 'retry' : 'sync',
				duration,
				status: 'failure',
				errorCode,
				retryCount,
				source: params.source,
			},
			subscriptionInfo: null,
		}
	}
}
