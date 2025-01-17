import { Axiom } from '@axiomhq/js'
import { Redis } from '@upstash/redis'

import { SubscriptionStatus } from '../../schemas/subscription-info'
import { logger } from '../utils/logger'

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

		// Log operation details
		logger.debug('Cache operation', {
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
		logger.debug('Starting cache operation', {
			operation,
			key,
		})

		try {
			const result = await fn()
			const duration = Date.now() - start

			logger.debug('Cache operation completed', {
				operation,
				key,
				duration,
				cache_result: result === null ? 'miss' : 'hit',
			})

			await this.metrics.trackOperation({
				operation,
				status: 'success',
				key_pattern: key.split(':')[0],
				latency_ms: duration,
				cache_result: result === null ? 'miss' : 'hit',
			})
			return result
		} catch (error) {
			const duration = Date.now() - start

			logger.error(
				error instanceof Error ? error : new Error('Cache operation failed'),
			)
			logger.debug('Cache operation failed', {
				operation,
				key,
				duration,
				error: error instanceof Error ? error.message : 'Unknown error',
			})

			await this.metrics.trackOperation({
				operation,
				status: 'failure',
				key_pattern: key.split(':')[0],
				latency_ms: duration,
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
		logger.debug('Getting Stripe customer ID', { userId })
		return this.trackOperation(
			'get_customer_id',
			this.buildCustomerKey(userId),
			() => this.redis.get<string>(this.buildCustomerKey(userId)),
		)
	}

	async setStripeCustomerId(userId: string, stripeCustomerId: string) {
		logger.debug('Setting Stripe customer ID', { userId, stripeCustomerId })
		return this.trackOperation(
			'set_customer_id',
			this.buildCustomerKey(userId),
			() => this.redis.set(this.buildCustomerKey(userId), stripeCustomerId),
		)
	}

	async getSubscriptionState(customerId: string) {
		logger.debug('Getting subscription state', { customerId })
		return this.trackOperation(
			'get_subscription_state',
			this.buildSubscriptionKey(customerId),
			() => this.redis.get(this.buildSubscriptionKey(customerId)),
		)
	}

	async setSubscriptionState(
		customerId: string,
		state: StripeCache['stripe:customer:{customerId}'],
	) {
		logger.debug('Setting subscription state', {
			customerId,
			subscriptionId: state.subscriptionId,
			status: state.status,
		})
		return this.trackOperation(
			'set_subscription_state',
			this.buildSubscriptionKey(customerId),
			() =>
				this.redis.set(this.buildSubscriptionKey(customerId), state, {
					ex: 24 * 60 * 60, // 24 hours
				}),
		)
	}

	async deleteSubscriptionState(customerId: string) {
		logger.debug('Deleting subscription state', { customerId })
		return this.trackOperation(
			'delete_subscription_state',
			this.buildSubscriptionKey(customerId),
			() => this.redis.del(this.buildSubscriptionKey(customerId)),
		)
	}

	async incrementSyncAttempts(customerId: string) {
		logger.debug('Incrementing sync attempts', { customerId })
		return this.trackOperation(
			'increment_sync_attempts',
			`${this.buildSubscriptionKey(customerId)}:sync_attempts`,
			() =>
				this.redis.incr(
					`${this.buildSubscriptionKey(customerId)}:sync_attempts`,
				),
		)
	}

	// Health check method
	async ping(): Promise<{
		status: 'healthy' | 'unhealthy'
		latency_ms: number
	}> {
		const start = Date.now()
		logger.debug('Starting health check')

		try {
			await this.redis.ping()
			const latency = Date.now() - start

			logger.debug('Health check completed', {
				status: 'healthy',
				latency_ms: latency,
			})

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

			logger.error(
				error instanceof Error ? error : new Error('Health check failed'),
			)
			logger.debug('Health check failed', {
				status: 'unhealthy',
				latency_ms: latency,
				error: error instanceof Error ? error.message : 'Unknown error',
			})

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
