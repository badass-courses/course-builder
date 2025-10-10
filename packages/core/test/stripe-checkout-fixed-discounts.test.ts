import { describe, expect, it, vi } from 'vitest'

import { stripeCheckout } from '../src/lib/pricing/stripe-checkout'
import type { PaymentsProviderConsumerConfig } from '../src/types'
import {
	createMockAdapter,
	createMockPaymentsAdapter,
	testMerchantCoupons,
	testPrices,
	testProducts,
	testPurchases,
	testUpgradableProducts,
} from './pricing-test-fixtures'

describe('stripeCheckout with Fixed Discount Coupons', () => {
	const mockConfig: PaymentsProviderConsumerConfig = {
		baseSuccessUrl: 'https://example.com',
		cancelUrl: 'https://example.com/cancel',
		errorRedirectUrl: 'https://example.com/error',
		paymentsAdapter: createMockPaymentsAdapter(),
	}

	describe('Fixed Amount Merchant Coupons', () => {
		it('should create transient amount_off coupon for fixed merchant coupons', async () => {
			const mockCreateCoupon = vi.fn().mockResolvedValue('stripe_coupon_123')
			const mockCreateSession = vi
				.fn()
				.mockResolvedValue('https://checkout.stripe.com/session_123')

			const mockPaymentsAdapter = createMockPaymentsAdapter({
				createCoupon: mockCreateCoupon,
				createCheckoutSession: mockCreateSession,
			})

			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(async () => testMerchantCoupons.fixedAmount20),
			})

			const result = await stripeCheckout({
				params: {
					productId: 'prod_basic',
					couponId: 'coupon_fixed_20',
					quantity: 1,
					bulk: false,
					cancelUrl: 'https://example.com/cancel',
				},
				config: { ...mockConfig, paymentsAdapter: mockPaymentsAdapter },
				adapter: mockAdapter,
			})

			expect(mockCreateCoupon).toHaveBeenCalledWith(
				expect.objectContaining({
					amount_off: 2000,
					name: expect.any(String),
					max_redemptions: 1,
					redeem_by: expect.any(Number),
					currency: 'USD',
					applies_to: {
						products: [expect.any(String)],
					},
				}),
			)
			expect(result.redirect).toBeDefined()
		})

		it('should include discount type and amount in checkout metadata', async () => {
			const mockCreateSession = vi
				.fn()
				.mockResolvedValue('https://checkout.stripe.com/session_123')

			const mockPaymentsAdapter = createMockPaymentsAdapter({
				createCheckoutSession: mockCreateSession,
			})

			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(async () => testMerchantCoupons.fixedAmount20),
			})

			await stripeCheckout({
				params: {
					productId: 'prod_basic',
					couponId: 'coupon_fixed_20',
					quantity: 1,
					bulk: false,
					cancelUrl: 'https://example.com/cancel',
				},
				config: { ...mockConfig, paymentsAdapter: mockPaymentsAdapter },
				adapter: mockAdapter,
			})

			const sessionCall = mockCreateSession.mock.calls[0][0]
			expect(sessionCall.metadata).toMatchObject({
				discountType: 'fixed',
				discountAmount: 2000,
			})
		})

		it('should apply fixed discount coupon with correct amount', async () => {
			const mockCreateCoupon = vi.fn().mockResolvedValue('coupon_123')

			const mockPaymentsAdapter = createMockPaymentsAdapter({
				createCoupon: mockCreateCoupon,
			})

			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(async () => testMerchantCoupons.fixedAmount75),
			})

			await stripeCheckout({
				params: {
					productId: 'prod_basic',
					couponId: 'coupon_fixed_75',
					quantity: 1,
					bulk: false,
					cancelUrl: 'https://example.com/cancel',
				},
				config: { ...mockConfig, paymentsAdapter: mockPaymentsAdapter },
				adapter: mockAdapter,
			})

			expect(mockCreateCoupon).toHaveBeenCalledWith(
				expect.objectContaining({
					amount_off: 7500, // $75
				}),
			)
		})
	})

	describe('Percentage Merchant Coupons (Existing Functionality)', () => {
		it('should create promotion code for percentage merchant coupons', async () => {
			const mockCreatePromotionCode = vi.fn().mockResolvedValue('promo_123')

			const mockPaymentsAdapter = createMockPaymentsAdapter({
				createPromotionCode: mockCreatePromotionCode,
			})

			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(async () => testMerchantCoupons.percentage25),
			})

			await stripeCheckout({
				params: {
					productId: 'prod_basic',
					couponId: 'coupon_percent_25',
					quantity: 1,
					bulk: false,
					cancelUrl: 'https://example.com/cancel',
				},
				config: { ...mockConfig, paymentsAdapter: mockPaymentsAdapter },
				adapter: mockAdapter,
			})

			expect(mockCreatePromotionCode).toHaveBeenCalledWith({
				coupon: expect.any(String), // Stripe coupon identifier
				max_redemptions: 1,
				expires_at: expect.any(Number),
			})
		})

		it('should include percentage discount in metadata', async () => {
			const mockCreateSession = vi
				.fn()
				.mockResolvedValue('https://checkout.stripe.com/session_123')

			const mockPaymentsAdapter = createMockPaymentsAdapter({
				createCheckoutSession: mockCreateSession,
			})

			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(async () => testMerchantCoupons.percentage25),
			})

			await stripeCheckout({
				params: {
					productId: 'prod_basic',
					couponId: 'coupon_percent_25',
					quantity: 1,
					bulk: false,
					cancelUrl: 'https://example.com/cancel',
				},
				config: { ...mockConfig, paymentsAdapter: mockPaymentsAdapter },
				adapter: mockAdapter,
			})

			const sessionCall = mockCreateSession.mock.calls[0][0]
			expect(sessionCall.metadata).toMatchObject({
				discountType: 'percentage',
				discountAmount: 25, // 25% as integer
			})
		})
	})

	describe('Upgrade Scenarios', () => {
		it('should create upgrade amount_off coupon with correct amount', async () => {
			const mockCreateCoupon = vi.fn().mockResolvedValue('upgrade_coupon_123')

			const mockPaymentsAdapter = createMockPaymentsAdapter({
				createCoupon: mockCreateCoupon,
			})

			const mockAdapter = createMockAdapter({
				getProduct: vi.fn(async (id: string) => {
					if (id === 'prod_bundle') return testProducts.bundle
					return testProducts.basic
				}),
				getPriceForProduct: vi.fn(async (productId: string) => {
					if (productId === 'prod_bundle') return testPrices.bundle
					return testPrices.basic
				}),
				getPurchase: vi.fn(async () => testPurchases.validBasic),
				getUpgradableProducts: vi.fn(async () => testUpgradableProducts[0]),
				pricesOfPurchasesTowardOneBundle: vi.fn(async () => [testPrices.basic]),
				getUser: vi.fn(async () => ({
					id: 'user_1',
					email: 'test@example.com',
				})),
				getMerchantCustomerForUserId: vi.fn(async () => ({
					id: 'merchant_customer_1',
					identifier: 'cus_123',
					merchantAccountId: 'merchant_1',
					userId: 'user_1',
					createdAt: new Date(),
				})),
			})

			await stripeCheckout({
				params: {
					productId: 'prod_bundle', // $200
					upgradeFromPurchaseId: 'purchase_valid_basic', // $100 credit
					userId: 'user_1',
					quantity: 1,
					bulk: false,
					cancelUrl: 'https://example.com/cancel',
				},
				config: { ...mockConfig, paymentsAdapter: mockPaymentsAdapter },
				adapter: mockAdapter,
			})

			expect(mockCreateCoupon).toHaveBeenCalledWith(
				expect.objectContaining({
					amount_off: expect.any(Number),
					name: expect.stringContaining('Upgrade'),
				}),
			)
		})

		it('should not stack upgrade and fixed merchant discounts', async () => {
			const mockCreateCoupon = vi.fn().mockResolvedValue('coupon_123')

			const mockPaymentsAdapter = createMockPaymentsAdapter({
				createCoupon: mockCreateCoupon,
			})

			const mockAdapter = createMockAdapter({
				getProduct: vi.fn(async (id: string) => {
					if (id === 'prod_bundle') return testProducts.bundle
					return testProducts.basic
				}),
				getPriceForProduct: vi.fn(async (productId: string) => {
					if (productId === 'prod_bundle') return testPrices.bundle
					return testPrices.basic
				}),
				getPurchase: vi.fn(async () => testPurchases.validBasic),
				getMerchantCoupon: vi.fn(async () => testMerchantCoupons.fixedAmount20),
				getUpgradableProducts: vi.fn(async () => testUpgradableProducts[0]),
				pricesOfPurchasesTowardOneBundle: vi.fn(async () => [testPrices.basic]),
				getUser: vi.fn(async () => ({
					id: 'user_1',
					email: 'test@example.com',
				})),
				getMerchantCustomerForUserId: vi.fn(async () => ({
					id: 'merchant_customer_1',
					identifier: 'cus_123',
					merchantAccountId: 'merchant_1',
					userId: 'user_1',
					createdAt: new Date(),
				})),
			})

			await stripeCheckout({
				params: {
					productId: 'prod_bundle',
					couponId: 'coupon_fixed_20',
					upgradeFromPurchaseId: 'purchase_valid_basic',
					userId: 'user_1',
					quantity: 1,
					bulk: false,
					cancelUrl: 'https://example.com/cancel',
				},
				config: { ...mockConfig, paymentsAdapter: mockPaymentsAdapter },
				adapter: mockAdapter,
			})

			// Should only create ONE coupon (the better one)
			expect(mockCreateCoupon).toHaveBeenCalledTimes(1)
		})
	})

	describe('Checkout Session Creation', () => {
		it('should create checkout session with correct parameters', async () => {
			const mockCreateSession = vi
				.fn()
				.mockResolvedValue('https://checkout.stripe.com/session_123')

			const mockPaymentsAdapter = createMockPaymentsAdapter({
				createCheckoutSession: mockCreateSession,
			})

			const mockAdapter = createMockAdapter()

			await stripeCheckout({
				params: {
					productId: 'prod_basic',
					quantity: 1,
					bulk: false,
					cancelUrl: 'https://example.com/cancel',
				},
				config: { ...mockConfig, paymentsAdapter: mockPaymentsAdapter },
				adapter: mockAdapter,
			})

			expect(mockCreateSession).toHaveBeenCalledWith(
				expect.objectContaining({
					mode: 'payment',
					success_url: expect.stringContaining('thanks/purchase'),
					cancel_url: 'https://example.com/cancel',
					line_items: expect.arrayContaining([
						expect.objectContaining({
							quantity: 1,
						}),
					]),
				}),
			)
		})

		it('should return redirect URL on success', async () => {
			const mockPaymentsAdapter = createMockPaymentsAdapter()
			const mockAdapter = createMockAdapter()

			const result = await stripeCheckout({
				params: {
					productId: 'prod_basic',
					quantity: 1,
					bulk: false,
					cancelUrl: 'https://example.com/cancel',
				},
				config: { ...mockConfig, paymentsAdapter: mockPaymentsAdapter },
				adapter: mockAdapter,
			})

			expect(result).toHaveProperty('redirect')
			expect(result).toHaveProperty('status', 303)
			expect(result.redirect).toContain('checkout.stripe.com')
		})
	})

	describe('Error Handling', () => {
		it('should redirect to error URL when product not found', async () => {
			const mockAdapter = createMockAdapter({
				getProduct: vi.fn(async () => null),
			})

			const result = await stripeCheckout({
				params: {
					productId: 'nonexistent',
					quantity: 1,
					bulk: false,
					cancelUrl: 'https://example.com/cancel',
				},
				config: mockConfig,
				adapter: mockAdapter,
			})

			expect(result.status).toBe(303)
			expect(result.redirect).toBe('https://example.com/error')
		})

		it('should handle checkout session creation failure', async () => {
			const mockPaymentsAdapter = createMockPaymentsAdapter({
				createCheckoutSession: vi.fn().mockResolvedValue(null),
			})

			const mockAdapter = createMockAdapter()

			const result = await stripeCheckout({
				params: {
					productId: 'prod_basic',
					quantity: 1,
					bulk: false,
					cancelUrl: 'https://example.com/cancel',
				},
				config: { ...mockConfig, paymentsAdapter: mockPaymentsAdapter },
				adapter: mockAdapter,
			})

			expect(result.status).toBe(303)
			expect(result.redirect).toBe('https://example.com/error')
		})
	})

	describe('Customer Handling', () => {
		it('should use existing Stripe customer when available', async () => {
			const mockCreateSession = vi
				.fn()
				.mockResolvedValue('https://checkout.stripe.com/session_123')

			const mockPaymentsAdapter = createMockPaymentsAdapter({
				createCheckoutSession: mockCreateSession,
			})

			const mockAdapter = createMockAdapter({
				getUser: vi.fn(async () => ({
					id: 'user_1',
					email: 'test@example.com',
				})),
				getMerchantCustomerForUserId: vi.fn(async () => ({
					id: 'merchant_customer_1',
					identifier: 'cus_existing',
					merchantAccountId: 'merchant_1',
					userId: 'user_1',
					createdAt: new Date(),
				})),
			})

			await stripeCheckout({
				params: {
					productId: 'prod_basic',
					userId: 'user_1',
					quantity: 1,
					bulk: false,
					cancelUrl: 'https://example.com/cancel',
				},
				config: { ...mockConfig, paymentsAdapter: mockPaymentsAdapter },
				adapter: mockAdapter,
			})

			const sessionCall = mockCreateSession.mock.calls[0][0]
			expect(sessionCall.customer).toBe('cus_existing')
		})

		it('should create new customer when none exists', async () => {
			const mockCreateCustomer = vi.fn().mockResolvedValue('cus_new')
			const mockCreateMerchantCustomer = vi.fn()

			const mockPaymentsAdapter = createMockPaymentsAdapter({
				createCustomer: mockCreateCustomer,
			})

			const mockAdapter = createMockAdapter({
				getUser: vi.fn(async () => ({
					id: 'user_1',
					email: 'test@example.com',
				})),
				getMerchantCustomerForUserId: vi.fn(async () => null),
				createMerchantCustomer: mockCreateMerchantCustomer,
			})

			await stripeCheckout({
				params: {
					productId: 'prod_basic',
					userId: 'user_1',
					quantity: 1,
					bulk: false,
					cancelUrl: 'https://example.com/cancel',
				},
				config: { ...mockConfig, paymentsAdapter: mockPaymentsAdapter },
				adapter: mockAdapter,
			})

			expect(mockCreateCustomer).toHaveBeenCalledWith({
				email: 'test@example.com',
				metadata: {
					userId: 'user_1',
				},
			})
			expect(mockCreateMerchantCustomer).toHaveBeenCalled()
		})

		it('should use customer_creation always for non-logged-in users', async () => {
			const mockCreateSession = vi
				.fn()
				.mockResolvedValue('https://checkout.stripe.com/session_123')

			const mockPaymentsAdapter = createMockPaymentsAdapter({
				createCheckoutSession: mockCreateSession,
			})

			const mockAdapter = createMockAdapter()

			await stripeCheckout({
				params: {
					productId: 'prod_basic',
					quantity: 1,
					bulk: false,
					cancelUrl: 'https://example.com/cancel',
				},
				config: { ...mockConfig, paymentsAdapter: mockPaymentsAdapter },
				adapter: mockAdapter,
			})

			const sessionCall = mockCreateSession.mock.calls[0][0]
			expect(sessionCall.customer_creation).toBe('always')
		})
	})

	describe('Success URL Generation', () => {
		it('should use upgrade success URL for upgrades', async () => {
			const mockCreateSession = vi
				.fn()
				.mockResolvedValue('https://checkout.stripe.com/session_123')

			const mockPaymentsAdapter = createMockPaymentsAdapter({
				createCheckoutSession: mockCreateSession,
			})

			const mockAdapter = createMockAdapter({
				getPurchase: vi.fn(async () => testPurchases.validBasic),
				getUpgradableProducts: vi.fn(async () => testUpgradableProducts[0]),
			})

			await stripeCheckout({
				params: {
					productId: 'prod_bundle',
					upgradeFromPurchaseId: 'purchase_valid_basic',
					quantity: 1,
					bulk: false,
					cancelUrl: 'https://example.com/cancel',
				},
				config: { ...mockConfig, paymentsAdapter: mockPaymentsAdapter },
				adapter: mockAdapter,
			})

			const sessionCall = mockCreateSession.mock.calls[0][0]
			expect(sessionCall.success_url).toContain('welcome')
			expect(sessionCall.success_url).toContain('upgrade=true')
		})

		it('should use purchase success URL for regular purchases', async () => {
			const mockCreateSession = vi
				.fn()
				.mockResolvedValue('https://checkout.stripe.com/session_123')

			const mockPaymentsAdapter = createMockPaymentsAdapter({
				createCheckoutSession: mockCreateSession,
			})

			const mockAdapter = createMockAdapter()

			await stripeCheckout({
				params: {
					productId: 'prod_basic',
					quantity: 1,
					bulk: false,
					cancelUrl: 'https://example.com/cancel',
				},
				config: { ...mockConfig, paymentsAdapter: mockPaymentsAdapter },
				adapter: mockAdapter,
			})

			const sessionCall = mockCreateSession.mock.calls[0][0]
			expect(sessionCall.success_url).toContain('thanks/purchase')
		})
	})

	describe('Metadata Completeness', () => {
		it('should include all required metadata fields', async () => {
			const mockCreateSession = vi
				.fn()
				.mockResolvedValue('https://checkout.stripe.com/session_123')

			const mockPaymentsAdapter = createMockPaymentsAdapter({
				createCheckoutSession: mockCreateSession,
			})

			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(async () => testMerchantCoupons.fixedAmount20),
				getUser: vi.fn(async () => ({
					id: 'user_1',
					email: 'test@example.com',
				})),
			})

			await stripeCheckout({
				params: {
					productId: 'prod_basic',
					couponId: 'coupon_fixed_20',
					userId: 'user_1',
					quantity: 1,
					bulk: false,
					cancelUrl: 'https://example.com/cancel',
					ip_address: '192.168.1.1',
					country: 'US',
				},
				config: { ...mockConfig, paymentsAdapter: mockPaymentsAdapter },
				adapter: mockAdapter,
			})

			const sessionCall = mockCreateSession.mock.calls[0][0]
			const metadata = sessionCall.metadata

			expect(metadata).toMatchObject({
				productId: 'prod_basic',
				product: 'Basic Course',
				userId: 'user_1',
				bulk: 'false',
				country: 'US',
				ip_address: '192.168.1.1',
				discountType: 'fixed',
				discountAmount: 2000,
			})
		})
	})
})
