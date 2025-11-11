import { describe, expect, it, vi } from 'vitest'

import { stripeCheckout } from '../src/lib/pricing/stripe-checkout'
import type { PaymentsProviderConsumerConfig } from '../src/types'
import {
	createMockAdapter,
	createMockPaymentsAdapter,
	testMerchantCoupons,
	testPrices,
	testProducts,
} from './pricing-test-fixtures'

describe('stripeCheckout with Stackable Discounts', () => {
	const mockConfig: PaymentsProviderConsumerConfig = {
		baseSuccessUrl: 'https://example.com',
		cancelUrl: 'https://example.com/cancel',
		errorRedirectUrl: 'https://example.com/error',
		paymentsAdapter: createMockPaymentsAdapter(),
	}

	describe('Stackable Discount Flow', () => {
		it('should create reusable Stripe coupon and unique promotion code for stackable discounts', async () => {
			const mockCreateCoupon = vi
				.fn()
				.mockResolvedValue('stripe_coupon_stacked_150')
			const mockCreatePromotionCode = vi
				.fn()
				.mockResolvedValue('promo_code_unique_123')
			const mockCreateSession = vi
				.fn()
				.mockResolvedValue('https://checkout.stripe.com/session_123')

			const mockPaymentsAdapter = createMockPaymentsAdapter({
				createCoupon: mockCreateCoupon,
				createPromotionCode: mockCreatePromotionCode,
				createCheckoutSession: mockCreateSession,
			})

			const mockAdapter = createMockAdapter({
				getEntitlementsForUser: vi.fn(async () => [
					{
						id: 'entitlement_1',
						entitlementType: 'et_83732df61b0c95ea',
						userId: 'user_1',
						sourceType: 'COUPON',
						sourceId: 'coupon_credit_150',
						metadata: {},
					},
				]),
				getCoupon: vi.fn(async (id: string) => {
					if (id === 'coupon_credit_150') {
						return {
							id: 'coupon_credit_150',
							code: 'CREDIT150',
							merchantCouponId: 'merchant_coupon_credit_150',
							status: 0,
							fields: {
								stackable: true,
								eligibilityCondition: {
									type: 'hasValidProductPurchase',
									productId: 'prod_crash_course',
								},
							},
							maxUses: -1,
							default: false,
							usedCount: 0,
							createdAt: new Date(),
							percentageDiscount: 0,
							expires: null,
							bulkPurchases: [],
							redeemedBulkCouponPurchases: [],
						}
					}
					return null
				}),
				getMerchantCoupon: vi.fn(async (id: string) => {
					if (id === 'merchant_coupon_credit_150') {
						return {
							id: 'merchant_coupon_credit_150',
							identifier: 'stripe_coupon_credit_150',
							amountDiscount: 15000, // $150 in cents
							type: 'special credit',
							status: 1,
							merchantAccountId: 'merchant_1',
						}
					}
					return {
						id: 'merchant_coupon_early_bird',
						identifier: 'stripe_coupon_early_bird',
						percentageDiscount: 0.4,
						type: 'special',
						status: 1,
						merchantAccountId: 'merchant_1',
					}
				}),
				getDefaultCoupon: vi.fn(async () => ({
					defaultMerchantCoupon: {
						id: 'merchant_coupon_early_bird',
						identifier: 'stripe_coupon_early_bird',
						percentageDiscount: 0.4,
						type: 'special',
						status: 1,
						merchantAccountId: 'merchant_1',
					},
					defaultCoupon: {
						id: 'coupon_early_bird',
						code: 'EARLYBIRD',
						merchantCouponId: 'merchant_coupon_early_bird',
						status: 0,
						fields: { stackable: true },
						maxUses: -1,
						default: true,
						usedCount: 0,
						createdAt: new Date(),
						percentageDiscount: 0,
						expires: null,
						bulkPurchases: [],
						redeemedBulkCouponPurchases: [],
					},
				})),
				getMerchantCouponForTypeAndAmount: vi.fn(async () => null), // No existing stacked coupon
			})

			const result = await stripeCheckout({
				params: {
					productId: 'prod_basic',
					userId: 'user_1',
					quantity: 1,
					bulk: false,
					cancelUrl: 'https://example.com/cancel',
					country: 'US',
				},
				config: { ...mockConfig, paymentsAdapter: mockPaymentsAdapter },
				adapter: mockAdapter,
			})

			expect(mockCreateCoupon).toHaveBeenCalledWith(
				expect.objectContaining({
					amount_off: expect.any(Number),
					name: expect.stringContaining('Stacked Discount'),
					duration: 'forever',
					currency: 'USD',
					metadata: {
						type: 'stacked',
					},
				}),
			)

			expect(mockCreatePromotionCode).toHaveBeenCalledWith({
				coupon: 'stripe_coupon_stacked_150',
				max_redemptions: 1,
				expires_at: expect.any(Number),
			})

			expect(mockAdapter.createMerchantCoupon).toHaveBeenCalledWith(
				expect.objectContaining({
					identifier: 'stripe_coupon_stacked_150',
					type: 'stacked',
					amountDiscount: expect.any(Number),
				}),
			)

			expect(result.redirect).toBeDefined()
		})

		it('should reuse existing Stripe coupon when same discount amount exists', async () => {
			const mockCreateCoupon = vi
				.fn()
				.mockResolvedValue('stripe_coupon_stacked_150')
			const mockCreatePromotionCode = vi
				.fn()
				.mockResolvedValue('promo_code_unique_456')
			const mockCreateSession = vi
				.fn()
				.mockResolvedValue('https://checkout.stripe.com/session_123')

			const mockPaymentsAdapter = createMockPaymentsAdapter({
				createCoupon: mockCreateCoupon,
				createPromotionCode: mockCreatePromotionCode,
				createCheckoutSession: mockCreateSession,
			})

			const existingStackedCoupon = {
				id: 'merchant_coupon_stacked_150',
				identifier: 'stripe_coupon_stacked_150_existing',
				amountDiscount: 15000,
				type: 'stacked',
				status: 1,
				merchantAccountId: 'merchant_1',
			}

			const mockAdapter = createMockAdapter({
				getEntitlementsForUser: vi.fn(async () => [
					{
						id: 'entitlement_1',
						entitlementType: 'et_83732df61b0c95ea',
						userId: 'user_2',
						sourceType: 'COUPON',
						sourceId: 'coupon_credit_150',
						metadata: {},
					},
				]),
				getCoupon: vi.fn(async () => ({
					id: 'coupon_credit_150',
					code: 'CREDIT150',
					merchantCouponId: 'merchant_coupon_credit_150',
					status: 0,
					fields: { stackable: true },
					maxUses: -1,
					default: false,
					usedCount: 0,
					createdAt: new Date(),
					percentageDiscount: 0,
					expires: null,
					bulkPurchases: [],
					redeemedBulkCouponPurchases: [],
				})),
				getMerchantCoupon: vi.fn(async () => ({
					id: 'merchant_coupon_credit_150',
					identifier: 'stripe_coupon_credit_150',
					amountDiscount: 15000,
					type: 'special credit',
					status: 1,
					merchantAccountId: 'merchant_1',
				})),
				getDefaultCoupon: vi.fn(async () => ({
					defaultMerchantCoupon: {
						id: 'merchant_coupon_early_bird',
						identifier: 'stripe_coupon_early_bird',
						percentageDiscount: 0.4,
						type: 'special',
						status: 1,
						merchantAccountId: 'merchant_1',
					},
					defaultCoupon: {
						id: 'coupon_early_bird',
						code: 'EARLYBIRD',
						merchantCouponId: 'merchant_coupon_early_bird',
						status: 0,
						fields: { stackable: true },
						maxUses: -1,
						default: true,
						usedCount: 0,
						createdAt: new Date(),
						percentageDiscount: 0,
						expires: null,
						bulkPurchases: [],
						redeemedBulkCouponPurchases: [],
					},
				})),
				getMerchantCouponForTypeAndAmount: vi.fn(
					async () => existingStackedCoupon,
				),
			})

			await stripeCheckout({
				params: {
					productId: 'prod_basic',
					userId: 'user_2',
					quantity: 1,
					bulk: false,
					cancelUrl: 'https://example.com/cancel',
					country: 'US',
				},
				config: { ...mockConfig, paymentsAdapter: mockPaymentsAdapter },
				adapter: mockAdapter,
			})

			expect(mockCreateCoupon).not.toHaveBeenCalled()

			expect(mockCreatePromotionCode).toHaveBeenCalledWith({
				coupon: 'stripe_coupon_stacked_150_existing',
				max_redemptions: 1,
				expires_at: expect.any(Number),
			})
		})
	})
})
