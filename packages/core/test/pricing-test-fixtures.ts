import { vi } from 'vitest'

import type { CourseBuilderAdapter } from '../src/adapters'
import type {
	Coupon,
	MerchantCoupon,
	Price,
	Product,
	Purchase,
	UpgradableProduct,
} from '../src/schemas'
import type { PaymentsAdapter } from '../src/types'

/**
 * Test Products
 */
export const testProducts = {
	basic: {
		id: 'prod_basic',
		name: 'Basic Course',
		status: 1,
		type: 'self-paced',
		createdAt: new Date(),
	} as Product,
	bundle: {
		id: 'prod_bundle',
		name: 'Bundle',
		status: 1,
		type: 'self-paced',
		createdAt: new Date(),
	} as Product,
	expensive: {
		id: 'prod_expensive',
		name: 'Premium Course',
		status: 1,
		type: 'self-paced',
		createdAt: new Date(),
	} as Product,
	cheap: {
		id: 'prod_cheap',
		name: 'Mini Course',
		status: 1,
		type: 'self-paced',
		createdAt: new Date(),
	} as Product,
}

/**
 * Test Prices
 */
export const testPrices = {
	basic: {
		id: 'price_basic',
		productId: 'prod_basic',
		unitAmount: 100,
		status: 1,
		createdAt: new Date(),
	} as Price,
	bundle: {
		id: 'price_bundle',
		productId: 'prod_bundle',
		unitAmount: 200,
		status: 1,
		createdAt: new Date(),
	} as Price,
	expensive: {
		id: 'price_expensive',
		productId: 'prod_expensive',
		unitAmount: 500,
		status: 1,
		createdAt: new Date(),
	} as Price,
	cheap: {
		id: 'price_cheap',
		productId: 'prod_cheap',
		unitAmount: 50,
		status: 1,
		createdAt: new Date(),
	} as Price,
}

/**
 * Test Merchant Coupons
 */
export const testMerchantCoupons = {
	fixedAmount20: {
		id: 'coupon_fixed_20',
		identifier: 'stripe_fixed_20',
		amountDiscount: 2000, // $20 in cents
		type: 'special',
		status: 1,
		merchantAccountId: 'merchant_1',
	} as MerchantCoupon,
	fixedAmount75: {
		id: 'coupon_fixed_75',
		identifier: 'stripe_fixed_75',
		amountDiscount: 7500, // $75 in cents
		type: 'special',
		status: 1,
		merchantAccountId: 'merchant_1',
	} as MerchantCoupon,
	fixedAmount100: {
		id: 'coupon_fixed_100',
		identifier: 'stripe_fixed_100',
		amountDiscount: 10000, // $100 in cents
		type: 'special',
		status: 1,
		merchantAccountId: 'merchant_1',
	} as MerchantCoupon,
	fixedAmount200: {
		id: 'coupon_fixed_200',
		identifier: 'stripe_fixed_200',
		amountDiscount: 20000, // $200 in cents
		type: 'special',
		status: 1,
		merchantAccountId: 'merchant_1',
	} as MerchantCoupon,
	percentage25: {
		id: 'coupon_percent_25',
		identifier: 'stripe_percent_25',
		percentageDiscount: 0.25,
		type: 'special',
		status: 1,
		merchantAccountId: 'merchant_1',
	} as MerchantCoupon,
	ppp60: {
		id: 'coupon_ppp_bd',
		identifier: 'stripe_ppp_bd',
		percentageDiscount: 0.6,
		type: 'ppp',
		status: 1,
		merchantAccountId: 'merchant_1',
		country: 'BD',
	} as MerchantCoupon,
	ppp75: {
		id: 'coupon_ppp_india_75',
		identifier: 'stripe_ppp_india_75',
		percentageDiscount: 0.75,
		type: 'ppp',
		status: 1,
		merchantAccountId: 'merchant_1',
		country: 'IN',
	} as MerchantCoupon,
	bulk15: {
		id: 'coupon_bulk_5seats',
		identifier: 'stripe_bulk_5',
		percentageDiscount: 0.15,
		type: 'bulk',
		status: 1,
		merchantAccountId: 'merchant_1',
	} as MerchantCoupon,
	bulk20: {
		id: 'coupon_bulk_10seats',
		identifier: 'stripe_bulk_10',
		percentageDiscount: 0.2,
		type: 'bulk',
		status: 1,
		merchantAccountId: 'merchant_1',
	} as MerchantCoupon,
	bulk25: {
		id: 'coupon_bulk_15seats',
		identifier: 'stripe_bulk_15',
		percentageDiscount: 0.25,
		type: 'bulk',
		status: 1,
		merchantAccountId: 'merchant_1',
	} as MerchantCoupon,
	invalid: {
		id: 'coupon_invalid',
		identifier: 'stripe_invalid',
		percentageDiscount: 0.25,
		amountDiscount: 2000, // Both set - invalid!
		type: 'special',
		status: 1,
		merchantAccountId: 'merchant_1',
	} as MerchantCoupon,
}

/**
 * Test Purchases
 */
export const testPurchases = {
	validBasic: {
		id: 'purchase_valid_basic',
		userId: 'user_1',
		productId: 'prod_basic',
		merchantChargeId: 'ch_valid_1',
		merchantAccountId: 'merchant_1',
		status: 'Valid' as const,
		totalAmount: 100, // $100 in dollars
		createdAt: new Date(),
		fields: {},
	} as Purchase,
	restrictedBasic: {
		id: 'purchase_restricted_basic',
		userId: 'user_1',
		productId: 'prod_basic',
		merchantChargeId: 'ch_restricted_1',
		merchantAccountId: 'merchant_1',
		status: 'Restricted' as const,
		totalAmount: 40, // $40 in dollars (with PPP)
		createdAt: new Date(),
		fields: {},
	} as Purchase,
}

/**
 * Test Upgradable Products
 */
export const testUpgradableProducts: UpgradableProduct[] = [
	{
		upgradableFromId: 'prod_basic',
		upgradableToId: 'prod_bundle',
		position: 0,
		createdAt: null,
		updatedAt: null,
		deletedAt: null,
		metadata: {},
	},
]

/**
 * Mock CourseBuilderAdapter with default responses
 */
export function createMockAdapter(
	overrides?: Partial<CourseBuilderAdapter>,
): CourseBuilderAdapter {
	const defaultAdapter: CourseBuilderAdapter = {
		getProduct: vi.fn(async (id: string) => {
			return (
				Object.values(testProducts).find((p) => p.id === id) ||
				testProducts.basic
			)
		}),
		getPriceForProduct: vi.fn(async (productId: string) => {
			return (
				Object.values(testPrices).find((p) => p.productId === productId) ||
				testPrices.basic
			)
		}),
		getMerchantCoupon: vi.fn(async (id: string) => {
			return (
				Object.values(testMerchantCoupons).find((c) => c.id === id) ||
				testMerchantCoupons.fixedAmount20
			)
		}),
		getCoupon: vi.fn(async (id: string) => {
			return null
		}),
		getPurchase: vi.fn(async (id: string) => {
			return Object.values(testPurchases).find((p) => p.id === id) || null
		}),
		getUpgradableProducts: vi.fn(
			async (options: {
				upgradableFromId: string
				upgradableToId: string
			}): Promise<UpgradableProduct[]> => {
				const match = testUpgradableProducts.find(
					(up) =>
						up.upgradableFromId === options.upgradableFromId &&
						up.upgradableToId === options.upgradableToId,
				)
				return match ? [match] : []
			},
		),
		availableUpgradesForProduct: vi.fn(
			async (purchases: Purchase[], productId: string) => {
				const hasBasicPurchase = purchases.some(
					(p) => p.productId === 'prod_basic',
				)
				if (hasBasicPurchase && productId === 'prod_bundle') {
					return testUpgradableProducts
				}
				return []
			},
		),
		pricesOfPurchasesTowardOneBundle: vi.fn(
			async (options: { userId?: string; bundleId: string }) => {
				// Simulate returning prices of prior purchases
				return [testPrices.basic]
			},
		),
		getMerchantAccount: vi.fn(async () => ({
			id: 'merchant_1',
			label: 'Test Merchant',
			identifier: 'acct_test',
			status: 1,
			createdAt: new Date(),
		})),
		getMerchantCustomerForUserId: vi.fn(async () => null),
		createMerchantCustomer: vi.fn(),
		getMerchantProductForProductId: vi.fn(async (productId: string) => ({
			id: `merchant_product_${productId}`,
			identifier: `stripe_${productId}`,
			productId,
			merchantAccountId: 'merchant_1',
			status: 1,
			createdAt: new Date(),
		})),
		getMerchantPriceForProductId: vi.fn(async (merchantProductId: string) => ({
			id: `merchant_price_${merchantProductId}`,
			identifier: `stripe_price_${merchantProductId}`,
			merchantProductId,
			status: 1,
			priceId: 'price_basic',
			createdAt: new Date(),
		})),
		getUser: vi.fn(async (id: string) => ({
			id,
			email: `test@example.com`,
		})),
		getPurchasesForUser: vi.fn(async (userId?: string) => {
			// Return purchases for the test user
			if (!userId) return []
			return Object.values(testPurchases).filter((p) => p.userId === userId)
		}),
		getMerchantCouponForTypeAndPercent: vi.fn(
			async (options: { type: string; percentageDiscount: number }) => {
				// Find coupon matching type and percentage
				return (
					Object.values(testMerchantCoupons).find(
						(c) =>
							c.type === options.type &&
							c.percentageDiscount === options.percentageDiscount,
					) || null
				)
			},
		),
		getMerchantCouponsForTypeAndPercent: vi.fn(
			async (options: { type: string; percentageDiscount: number }) => {
				// Find all coupons matching type and percentage
				return Object.values(testMerchantCoupons).filter(
					(c) =>
						c.type === options.type &&
						c.percentageDiscount === options.percentageDiscount,
				)
			},
		),
	} as unknown as CourseBuilderAdapter

	return { ...defaultAdapter, ...overrides } as CourseBuilderAdapter
}

/**
 * Mock PaymentsAdapter (Stripe)
 */
export function createMockPaymentsAdapter(
	overrides?: Partial<PaymentsAdapter>,
): PaymentsAdapter {
	const defaultAdapter: PaymentsAdapter = {
		getCouponPercentOff: vi.fn(async (identifier: string) => {
			// Return based on test coupon identifiers
			if (identifier.includes('percent_25')) return 0.25
			if (identifier.includes('ppp')) return 0.6
			if (identifier.includes('bulk')) return 0.2
			return 0
		}),
		getCouponAmountOff: vi.fn(async (identifier: string) => {
			// Return based on test coupon identifiers
			if (identifier.includes('fixed_20')) return 2000
			if (identifier.includes('fixed_75')) return 7500
			if (identifier.includes('fixed_100')) return 10000
			if (identifier.includes('fixed_200')) return 20000
			return 0
		}),
		createCoupon: vi.fn(async () => 'stripe_coupon_created_123'),
		createPromotionCode: vi.fn(async () => 'promo_code_123'),
		createCheckoutSession: vi.fn(
			async () => 'https://checkout.stripe.com/session_123',
		),
		createCustomer: vi.fn(async () => 'cus_123'),
		getPrice: vi.fn(async (priceId: string) => ({
			id: priceId,
			unit_amount: 10000,
			currency: 'usd',
			recurring: null,
		})),
	} as unknown as PaymentsAdapter

	return { ...defaultAdapter, ...overrides } as PaymentsAdapter
}

/**
 * Test data for different scenarios
 */
export const scenarios = {
	simpleFixedDiscount: {
		product: testProducts.basic,
		price: testPrices.basic,
		coupon: testMerchantCoupons.fixedAmount20,
		expectedPrice: 80, // $100 - $20
	},
	fixedDiscountExceedsPrice: {
		product: testProducts.cheap,
		price: testPrices.cheap,
		coupon: testMerchantCoupons.fixedAmount75,
		expectedPrice: 0, // $50 - $75 = clamped to $0
	},
	percentageDiscount: {
		product: testProducts.basic,
		price: testPrices.basic,
		coupon: testMerchantCoupons.percentage25,
		expectedPrice: 75, // $100 * 0.75
	},
	upgradeWithFixedMerchant: {
		product: testProducts.bundle,
		price: testPrices.bundle,
		purchase: testPurchases.validBasic,
		coupon: testMerchantCoupons.fixedAmount20,
		expectedUpgradeDiscount: 100, // $100 credit from basic purchase
		expectedMerchantDiscount: 20,
		expectedFinalPrice: 100, // $200 - max($100, $20) = $200 - $100
	},
}
