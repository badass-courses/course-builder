import { Redis } from '@upstash/redis'

import { SubscriptionStatus } from '../../schemas/subscription-info'

export type StripeCache = {
	// Customer mapping
	'stripe:user:{userId}': string // stripeCustomerId
	// Subscription state
	'stripe:customer:{customerId}': {
		subscriptionId: string
		status: SubscriptionStatus
		priceId: string
		currentPeriodEnd: number
		organizationId: string
		metadata: Record<string, any>
		lastSyncedAt: number
		syncAttempts: number
	}
}

export class StripeCacheClient {
	constructor(private redis: Redis) {}

	private buildCustomerKey(userId: string) {
		return `stripe:user:${userId}`
	}

	private buildSubscriptionKey(customerId: string) {
		return `stripe:customer:${customerId}`
	}

	async getStripeCustomerId(userId: string) {
		return this.redis.get<string>(this.buildCustomerKey(userId))
	}

	async setStripeCustomerId(userId: string, stripeCustomerId: string) {
		return this.redis.set(this.buildCustomerKey(userId), stripeCustomerId)
	}

	async getSubscriptionState(customerId: string) {
		return this.redis.get<StripeCache['stripe:customer:{customerId}']>(
			this.buildSubscriptionKey(customerId),
		)
	}

	async setSubscriptionState(
		customerId: string,
		state: StripeCache['stripe:customer:{customerId}'],
	) {
		return this.redis.set(this.buildSubscriptionKey(customerId), state, {
			ex: 24 * 60 * 60, // 24 hours
		})
	}

	async deleteSubscriptionState(customerId: string) {
		return this.redis.del(this.buildSubscriptionKey(customerId))
	}

	async incrementSyncAttempts(customerId: string) {
		const state = await this.getSubscriptionState(customerId)
		if (!state) return

		return this.setSubscriptionState(customerId, {
			...state,
			syncAttempts: (state.syncAttempts || 0) + 1,
			lastSyncedAt: Date.now(),
		})
	}
}

export function createStripeCacheClient(redis: Redis) {
	return new StripeCacheClient(redis)
}
