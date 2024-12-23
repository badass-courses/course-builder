import { describe, expect, it, vi } from 'vitest'

import { CourseBuilderAdapter } from '../src/adapters'
import {
	determinePurchaseType,
	parsePurchaseInfoFromCheckoutSession,
} from '../src/lib/pricing/stripe-purchase-utils'
import {
	EXISTING_BULK_COUPON,
	INDIVIDUAL_TO_BULK_UPGRADE,
	NEW_BULK_COUPON,
	NEW_INDIVIDUAL_PURCHASE,
} from '../src/schemas/purchase-type'

describe('stripe-purchase-utils', () => {
	describe('parsePurchaseInfoFromCheckoutSession', () => {
		it('parses basic checkout session data', async () => {
			const mockCheckoutSession = {
				customer: {
					email: 'test@test.com',
					name: 'Test User',
					id: 'cus_123',
				},
				line_items: {
					data: [
						{
							price: {
								product: {
									id: 'prod_123',
									name: 'Test Product',
								},
							},
							quantity: 2,
							discounts: [],
						},
					],
				},
				payment_intent: {
					latest_charge: {
						id: 'ch_123',
						amount: 2000,
					},
				},
				metadata: {
					someKey: 'someValue',
				},
			} as any

			const mockAdapter = {
				getUserByEmail: vi.fn().mockResolvedValue({ id: 'user_123' }),
				getPurchaseForStripeCharge: vi.fn().mockResolvedValue(null),
				getPurchasesForUser: vi.fn().mockResolvedValue([]),
			} as unknown as CourseBuilderAdapter

			const result = await parsePurchaseInfoFromCheckoutSession(
				mockCheckoutSession,
				mockAdapter,
			)

			expect(result).toMatchObject({
				customerIdentifier: 'cus_123',
				email: 'test@test.com',
				name: 'Test User',
				productIdentifier: 'prod_123',
				quantity: 2,
				chargeIdentifier: 'ch_123',
				chargeAmount: 2000,
			})
		})

		it('handles missing line items gracefully', async () => {
			const mockCheckoutSession = {
				customer: {
					email: 'test@test.com',
					name: 'Test User',
					id: 'cus_123',
				},
				line_items: undefined,
				payment_intent: {
					latest_charge: {
						id: 'ch_123',
						amount: 2000,
					},
				},
			} as any

			const mockAdapter = {
				getUserByEmail: vi.fn().mockResolvedValue(null),
			} as unknown as CourseBuilderAdapter

			await expect(
				parsePurchaseInfoFromCheckoutSession(mockCheckoutSession, mockAdapter),
			).rejects.toThrow()
		})
	})

	describe('determinePurchaseType', () => {
		it('returns NEW_BULK_COUPON for first bulk purchase', async () => {
			const mockAdapter = {
				getUserByEmail: vi.fn().mockResolvedValue({ id: 'user_123' }),
				getPurchaseForStripeCharge: vi.fn().mockResolvedValue({
					id: 'purchase_123',
					productId: 'prod_123',
					bulkCoupon: { id: 'coupon_123' },
					createdAt: new Date(),
				}),
				getPurchasesForUser: vi.fn().mockResolvedValue([]),
			} as unknown as CourseBuilderAdapter

			const result = await determinePurchaseType({
				chargeIdentifier: 'ch_123',
				email: 'test@test.com',
				courseBuilderAdapter: mockAdapter,
			})

			expect(result).toBe(NEW_BULK_COUPON)
		})

		it('returns INDIVIDUAL_TO_BULK_UPGRADE when upgrading from individual to bulk', async () => {
			const mockAdapter = {
				getUserByEmail: vi.fn().mockResolvedValue({ id: 'user_123' }),
				getPurchaseForStripeCharge: vi.fn().mockResolvedValue({
					id: 'purchase_123',
					productId: 'prod_123',
					bulkCoupon: { id: 'coupon_123' },
					createdAt: new Date(),
				}),
				getPurchasesForUser: vi.fn().mockResolvedValue([
					{
						id: 'purchase_previous',
						productId: 'prod_123',
						bulkCoupon: null,
						createdAt: new Date(Date.now() - 1000),
					},
				]),
			} as unknown as CourseBuilderAdapter

			const result = await determinePurchaseType({
				chargeIdentifier: 'ch_123',
				email: 'test@test.com',
				courseBuilderAdapter: mockAdapter,
			})

			expect(result).toBe(INDIVIDUAL_TO_BULK_UPGRADE)
		})

		it('returns EXISTING_BULK_COUPON for additional bulk seats', async () => {
			const now = Date.now()

			const mockAdapter = {
				getUserByEmail: vi.fn().mockResolvedValue({ id: 'user_123' }),
				getPurchaseForStripeCharge: vi.fn().mockResolvedValue({
					id: 'purchase_123',
					productId: 'prod_123',
					bulkCoupon: { id: 'coupon_123' },
					createdAt: new Date(now),
				}),
				getPurchasesForUser: vi.fn().mockResolvedValue([
					{
						id: 'purchase_previous',
						productId: 'prod_123',
						bulkCoupon: { id: 'coupon_123' },
						createdAt: new Date(now - 1000),
					},
				]),
			} as unknown as CourseBuilderAdapter

			const result = await determinePurchaseType({
				chargeIdentifier: 'ch_123',
				email: 'test@test.com',
				courseBuilderAdapter: mockAdapter,
			})

			expect(result).toBe(EXISTING_BULK_COUPON)
		})

		it('returns NEW_INDIVIDUAL_PURCHASE as fallback on error', async () => {
			const mockAdapter = {
				getUserByEmail: vi.fn().mockRejectedValue(new Error('DB Error')),
			} as unknown as CourseBuilderAdapter

			const result = await determinePurchaseType({
				chargeIdentifier: 'ch_123',
				email: 'test@test.com',
				courseBuilderAdapter: mockAdapter,
			})

			expect(result).toBe(NEW_INDIVIDUAL_PURCHASE)
		})

		it('handles multiple bulk purchases with different coupon IDs correctly', async () => {
			const mockAdapter = {
				getUserByEmail: vi.fn().mockResolvedValue({ id: 'user_123' }),
				getPurchaseForStripeCharge: vi.fn().mockResolvedValue({
					id: 'purchase_123',
					productId: 'prod_123',
					bulkCoupon: { id: 'coupon_123' },
					createdAt: new Date(),
				}),
				getPurchasesForUser: vi.fn().mockResolvedValue([
					{
						id: 'purchase_previous',
						productId: 'prod_123',
						bulkCoupon: { id: 'different_coupon_123' },
						createdAt: new Date(Date.now() - 1000),
					},
				]),
			} as unknown as CourseBuilderAdapter

			const result = await determinePurchaseType({
				chargeIdentifier: 'ch_123',
				email: 'test@test.com',
				courseBuilderAdapter: mockAdapter,
			})

			expect(result).toBe(NEW_BULK_COUPON)
		})

		it('handles purchases for different products correctly', async () => {
			const mockAdapter = {
				getUserByEmail: vi.fn().mockResolvedValue({ id: 'user_123' }),
				getPurchaseForStripeCharge: vi.fn().mockResolvedValue({
					id: 'purchase_123',
					productId: 'prod_123',
					bulkCoupon: { id: 'coupon_123' },
					createdAt: new Date(),
				}),
				getPurchasesForUser: vi.fn().mockResolvedValue([
					{
						id: 'purchase_previous',
						productId: 'different_prod_123',
						bulkCoupon: { id: 'coupon_123' },
						createdAt: new Date(Date.now() - 1000),
					},
				]),
			} as unknown as CourseBuilderAdapter

			const result = await determinePurchaseType({
				chargeIdentifier: 'ch_123',
				email: 'test@test.com',
				courseBuilderAdapter: mockAdapter,
			})

			expect(result).toBe(NEW_BULK_COUPON)
		})

		it('handles redeemed bulk coupon purchases correctly', async () => {
			const mockAdapter = {
				getUserByEmail: vi.fn().mockResolvedValue({ id: 'user_123' }),
				getPurchaseForStripeCharge: vi.fn().mockResolvedValue({
					id: 'purchase_123',
					productId: 'prod_123',
					bulkCoupon: { id: 'coupon_123' },
					createdAt: new Date(),
				}),
				getPurchasesForUser: vi.fn().mockResolvedValue([
					{
						id: 'purchase_previous',
						productId: 'prod_123',
						redeemedBulkCouponId: 'some_other_coupon',
						createdAt: new Date(Date.now() - 1000),
					},
				]),
			} as unknown as CourseBuilderAdapter

			const result = await determinePurchaseType({
				chargeIdentifier: 'ch_123',
				email: 'test@test.com',
				courseBuilderAdapter: mockAdapter,
			})

			expect(result).toBe(NEW_BULK_COUPON)
		})

		it('handles null email correctly', async () => {
			const mockAdapter = {
				getUserByEmail: vi.fn().mockResolvedValue(null),
				getPurchaseForStripeCharge: vi.fn().mockResolvedValue({
					id: 'purchase_123',
					productId: 'prod_123',
					bulkCoupon: { id: 'coupon_123' },
					createdAt: new Date(),
				}),
			} as unknown as CourseBuilderAdapter

			const result = await determinePurchaseType({
				chargeIdentifier: 'ch_123',
				email: null,
				courseBuilderAdapter: mockAdapter,
			})

			expect(result).toBe(NEW_INDIVIDUAL_PURCHASE)
		})
	})
})
