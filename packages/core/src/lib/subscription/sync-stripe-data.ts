import { Redis } from '@upstash/redis'
import { Stripe } from 'stripe'

import {
	SubscriptionInfo,
	SubscriptionStatus,
} from '../../schemas/subscription-info'
import { StripeCacheClient } from './stripe-cache'

export type SyncLog = {
	customerId: string
	operation: 'sync' | 'retry' | 'recovery'
	duration: number
	status: 'success' | 'failure'
	errorCode?: string
	retryCount: number
	source: 'webhook' | 'success-page' | 'manual'
}

export async function syncStripeDataToKV(params: {
	stripe: Stripe
	redis: Redis
	customerId: string
	source: SyncLog['source']
	retryCount?: number
}): Promise<{
	log: SyncLog
	subscriptionInfo: SubscriptionInfo | null
}> {
	const startTime = Date.now()
	const cache = new StripeCacheClient(params.redis)
	const retryCount = params.retryCount || 0

	try {
		// 1. Get customer and active subscription
		const customer = await params.stripe.customers.retrieve(params.customerId, {
			expand: ['subscriptions.data.plan.product'],
		})

		if (!('subscriptions' in customer)) {
			throw new Error('Invalid customer object')
		}

		const subscription = customer.subscriptions?.data[0]

		// 2. Build subscription info
		const subscriptionInfo = subscription
			? {
					customerIdentifier: customer.id,
					email: customer.email,
					name: customer.name,
					productIdentifier: subscription.plan.product.id,
					product: subscription.plan.product,
					subscriptionIdentifier: subscription.id,
					priceIdentifier: subscription.plan.id,
					quantity: subscription.quantity,
					status: subscription.status as SubscriptionStatus,
					currentPeriodStart: new Date(
						subscription.current_period_start * 1000,
					),
					currentPeriodEnd: new Date(subscription.current_period_end * 1000),
					metadata: subscription.metadata,
				}
			: null

		// 3. Update Redis cache
		if (subscriptionInfo) {
			await cache.setSubscriptionState(params.customerId, {
				subscriptionId: subscriptionInfo.subscriptionIdentifier,
				status: subscriptionInfo.status,
				priceId: subscriptionInfo.priceIdentifier,
				currentPeriodEnd: subscription.current_period_end,
				organizationId: subscription.metadata.organizationId,
				metadata: subscription.metadata,
				lastSyncedAt: Date.now(),
				syncAttempts: retryCount,
			})
		} else {
			await cache.deleteSubscriptionState(params.customerId)
		}

		return {
			log: {
				customerId: params.customerId,
				operation: retryCount > 0 ? 'retry' : 'sync',
				duration: Date.now() - startTime,
				status: 'success',
				retryCount,
				source: params.source,
			},
			subscriptionInfo,
		}
	} catch (error) {
		const errorCode = error instanceof Error ? error.message : 'UNKNOWN_ERROR'

		// Increment sync attempts on failure
		await cache.incrementSyncAttempts(params.customerId)

		return {
			log: {
				customerId: params.customerId,
				operation: retryCount > 0 ? 'retry' : 'sync',
				duration: Date.now() - startTime,
				status: 'failure',
				errorCode,
				retryCount,
				source: params.source,
			},
			subscriptionInfo: null,
		}
	}
}
