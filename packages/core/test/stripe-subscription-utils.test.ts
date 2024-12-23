import type Stripe from 'stripe'
import { describe, expect, it } from 'vitest'

import {
	determineSubscriptionPermissions,
	parseSubscriptionInfoFromCheckoutSession,
} from '../src/lib/pricing/stripe-subscription-utils'
import { CheckoutSessionMetadataSchema } from '../src/schemas/stripe/checkout-session-metadata'

describe('stripe-subscription-utils', () => {
	describe('parseSubscriptionInfoFromCheckoutSession', () => {
		it('parses subscription info from checkout session', async () => {
			const mockCheckoutSession = {
				customer: {
					id: 'cus_123',
					email: 'test@example.com',
					name: 'Test User',
				},
				subscription: {
					id: 'sub_123',
					status: 'active',
					current_period_start: 1234567890,
					current_period_end: 1234567890,
					plan: {
						product: {
							id: 'prod_123',
							name: 'Test Product',
						},
					},
					items: {
						data: [
							{
								price: {
									id: 'price_123',
								},
								quantity: 2,
							},
						],
					},
				},
				metadata: {
					country: 'US',
					ip_address: '127.0.0.1',
					productId: 'prod_123',
					product: 'Test Product',
					siteName: 'default',
					bulk: 'true',
				},
			} as unknown as Stripe.Checkout.Session

			const result =
				await parseSubscriptionInfoFromCheckoutSession(mockCheckoutSession)

			expect(result).toEqual({
				customerIdentifier: 'cus_123',
				email: 'test@example.com',
				name: 'Test User',
				productIdentifier: 'prod_123',
				product: {
					id: 'prod_123',
					name: 'Test Product',
				},
				subscriptionIdentifier: 'sub_123',
				priceIdentifier: 'price_123',
				quantity: 2,
				status: 'active',
				currentPeriodStart: new Date(1234567890 * 1000),
				currentPeriodEnd: new Date(1234567890 * 1000),
				metadata: {
					bulk: 'true',
					country: 'US',
					ip_address: '127.0.0.1',
					productId: 'prod_123',
					product: 'Test Product',
					siteName: 'default',
				},
			})
		})

		it('throws error when no subscription item found', async () => {
			const mockCheckoutSession = {
				customer: {
					id: 'cus_123',
					email: 'test@example.com',
					name: 'Test User',
				},
				subscription: {
					id: 'sub_123',
					items: {
						data: [],
					},
				},
			} as unknown as Stripe.Checkout.Session

			await expect(
				parseSubscriptionInfoFromCheckoutSession(mockCheckoutSession),
			).rejects.toThrow('No subscription item found')
		})
	})

	describe('determineSubscriptionPermissions', () => {
		it('returns single-user permissions when bulk is false', () => {
			const metadata = CheckoutSessionMetadataSchema.parse({
				bulk: 'false',
				country: 'US',
				ip_address: '127.0.0.1',
				productId: 'prod_123',
				product: 'Test Product',
				siteName: 'default',
			})

			const result = determineSubscriptionPermissions(
				metadata,
				'org_123',
				'member_123',
			)

			expect(result).toEqual({
				organizationId: 'org_123',
				purchasingMemberId: 'member_123',
				isMultiUser: false,
				assignToMember: 'member_123',
			})
		})

		it('returns multi-user permissions when bulk is true', () => {
			const metadata = CheckoutSessionMetadataSchema.parse({
				bulk: 'true',
				country: 'US',
				ip_address: '127.0.0.1',
				productId: 'prod_123',
				product: 'Test Product',
				siteName: 'default',
			})

			const result = determineSubscriptionPermissions(
				metadata,
				'org_123',
				'member_123',
			)

			expect(result).toEqual({
				organizationId: 'org_123',
				purchasingMemberId: 'member_123',
				isMultiUser: true,
				assignToMember: undefined,
			})
		})
	})
})
