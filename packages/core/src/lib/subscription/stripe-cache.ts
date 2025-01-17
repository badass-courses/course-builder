import { Axiom } from '@axiomhq/js'
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

type MetricTags = {
	operation: string
	status: 'success' | 'failure'
	key_pattern: string
	cache_result?: 'hit' | 'miss'
}

type OperationMetrics = {
	latency_ms: number
} & MetricTags

export class StripeCacheMetrics {
	constructor(private axiom?: Axiom) {}

	async trackOperation(metrics: OperationMetrics) {
		const { latency_ms, ...tags } = metrics

		// Track in Axiom if available
		if (this.axiom && process.env.NEXT_PUBLIC_AXIOM_DATASET) {
			await this.axiom.ingest(process.env.NEXT_PUBLIC_AXIOM_DATASET, {
				event_type: 'stripe_cache_operation',
				component: 'stripe_cache',
				timestamp: new Date(),
				latency_ms,
				...tags,
			})
		}

		// Log for development
		console.log('[StripeCacheMetrics]', {
			event_type: 'stripe_cache_operation',
			latency_ms,
			...tags,
		})
	}
}

export class StripeCacheClient {
	private metrics: StripeCacheMetrics

	constructor(
		private redis: Redis,
		axiom?: any,
	) {
		this.metrics = new StripeCacheMetrics(axiom)
	}

	private async trackOperation<T>(
		operation: string,
		key: string,
		fn: () => Promise<T>,
	): Promise<T> {
		const start = Date.now()
		try {
			const result = await fn()
			await this.metrics.trackOperation({
				operation,
				status: 'success',
				key_pattern: key.split(':')[0],
				latency_ms: Date.now() - start,
				cache_result: result === null ? 'miss' : 'hit',
			})
			return result
		} catch (error) {
			await this.metrics.trackOperation({
				operation,
				status: 'failure',
				key_pattern: key.split(':')[0],
				latency_ms: Date.now() - start,
			})
			throw error
		}
	}

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
		return this.trackOperation(
			'get_subscription_state',
			`stripe:customer:${customerId}`,
			() => this.redis.get(`stripe:customer:${customerId}`),
		)
	}

	async setSubscriptionState(customerId: string, state: any) {
		return this.trackOperation(
			'set_subscription_state',
			`stripe:customer:${customerId}`,
			() =>
				this.redis.set(`stripe:customer:${customerId}`, state, {
					ex: 24 * 60 * 60, // 24 hours
				}),
		)
	}

	async deleteSubscriptionState(customerId: string) {
		return this.trackOperation(
			'delete_subscription_state',
			`stripe:customer:${customerId}`,
			() => this.redis.del(`stripe:customer:${customerId}`),
		)
	}

	async incrementSyncAttempts(customerId: string) {
		return this.trackOperation(
			'increment_sync_attempts',
			`stripe:customer:${customerId}:sync_attempts`,
			() => this.redis.incr(`stripe:customer:${customerId}:sync_attempts`),
		)
	}

	// Health check method
	async ping(): Promise<{
		status: 'healthy' | 'unhealthy'
		latency_ms: number
	}> {
		const start = Date.now()
		try {
			await this.redis.ping()
			const latency = Date.now() - start
			await this.metrics.trackOperation({
				operation: 'health_check',
				status: 'success',
				key_pattern: 'health',
				latency_ms: latency,
			})
			return {
				status: 'healthy',
				latency_ms: latency,
			}
		} catch (error) {
			const latency = Date.now() - start
			await this.metrics.trackOperation({
				operation: 'health_check',
				status: 'failure',
				key_pattern: 'health',
				latency_ms: latency,
			})
			return {
				status: 'unhealthy',
				latency_ms: latency,
			}
		}
	}
}

export function createStripeCacheClient(redis: Redis) {
	return new StripeCacheClient(redis)
}
