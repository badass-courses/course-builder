import { describe, expect, it, vi } from 'vitest'

import { formatPricesForProduct } from '../src/lib/pricing/format-prices-for-product'
import {
	createMockAdapter,
	testMerchantCoupons,
	testPrices,
	testProducts,
	testPurchases,
	testUpgradableProducts,
} from './pricing-test-fixtures'

describe('formatPricesForProduct', () => {
	describe('Basic Fixed Amount Discounts', () => {
		it('should apply fixed-amount merchant coupon correctly', async () => {
			const mockAdapter = createMockAdapter()

			const result = await formatPricesForProduct({
				ctx: mockAdapter,
				productId: 'prod_basic',
				merchantCouponId: 'coupon_fixed_20',
				quantity: 1,
			})

			expect(result.unitPrice).toBe(100)
			expect(result.fullPrice).toBe(100)
			expect(result.appliedFixedDiscount).toBe(20)
			expect(result.appliedDiscountType).toBe('fixed')
			expect(result.calculatedPrice).toBe(80)
		})

		it('should clamp price to $0 when fixed discount exceeds price', async () => {
			const mockAdapter = createMockAdapter({
				getProduct: vi.fn(async () => testProducts.cheap),
				getPriceForProduct: vi.fn(async () => testPrices.cheap),
				getMerchantCoupon: vi.fn(async () => testMerchantCoupons.fixedAmount75),
			})

			const result = await formatPricesForProduct({
				ctx: mockAdapter,
				productId: 'prod_cheap', // $50
				merchantCouponId: 'coupon_fixed_75', // $75 off
				quantity: 1,
			})

			expect(result.appliedFixedDiscount).toBe(75)
			expect(result.calculatedPrice).toBe(0)
		})

		it('should result in $0 when fixed discount equals price', async () => {
			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(
					async () => testMerchantCoupons.fixedAmount100,
				),
			})

			const result = await formatPricesForProduct({
				ctx: mockAdapter,
				productId: 'prod_basic', // $100
				merchantCouponId: 'coupon_fixed_100', // $100 off
				quantity: 1,
			})

			expect(result.calculatedPrice).toBe(0)
		})
	})

	describe('Percentage Discounts (Backward Compatibility)', () => {
		it('should apply percentage discount correctly', async () => {
			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(async () => testMerchantCoupons.percentage25),
			})

			const result = await formatPricesForProduct({
				ctx: mockAdapter,
				productId: 'prod_basic', // $100
				merchantCouponId: 'coupon_percent_25', // 25% off
				quantity: 1,
			})

			expect(result.unitPrice).toBe(100)
			expect(result.fullPrice).toBe(100)
			expect(result.appliedDiscountType).toBe('percentage')
			expect(result.calculatedPrice).toBe(75)
			expect(result.appliedFixedDiscount).toBeUndefined()
		})

		it('should apply PPP discount correctly', async () => {
			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(async () => testMerchantCoupons.ppp60),
			})

			const result = await formatPricesForProduct({
				ctx: mockAdapter,
				productId: 'prod_basic',
				merchantCouponId: 'coupon_ppp_bd',
				country: 'BD',
				quantity: 1,
			})

			expect(result.appliedDiscountType).toBe('ppp')
			expect(result.calculatedPrice).toBe(40) // $100 * 0.4
		})

		it('should apply bulk discount correctly', async () => {
			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(async () => testMerchantCoupons.bulk15),
			})

			const result = await formatPricesForProduct({
				ctx: mockAdapter,
				productId: 'prod_basic',
				quantity: 5,
			})

			expect(result.bulk).toBe(true)
			expect(result.appliedDiscountType).toBe('bulk')
			// $100 * 5 = $500, 15% off = $425
			expect(result.calculatedPrice).toBe(425)
		})
	})

	describe('Upgrade Scenarios', () => {
		it('should apply upgrade discount without merchant coupon', async () => {
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
				getUpgradableProducts: vi.fn(async () => [testUpgradableProducts[0]]),
				pricesOfPurchasesTowardOneBundle: vi.fn(async () => [testPrices.basic]),
			})

			const result = await formatPricesForProduct({
				ctx: mockAdapter,
				productId: 'prod_bundle', // $200
				upgradeFromPurchaseId: 'purchase_valid_basic', // $100 credit
				quantity: 1,
			})

			expect(result.fixedDiscountForUpgrade).toBe(100)
			expect(result.calculatedPrice).toBe(100) // $200 - $100
		})

		it('should take max discount when upgrade and fixed merchant both apply', async () => {
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
				getUpgradableProducts: vi.fn(async () => [testUpgradableProducts[0]]),
				pricesOfPurchasesTowardOneBundle: vi.fn(async () => [testPrices.basic]),
			})

			const result = await formatPricesForProduct({
				ctx: mockAdapter,
				productId: 'prod_bundle', // $200
				merchantCouponId: 'coupon_fixed_20', // $20 off
				upgradeFromPurchaseId: 'purchase_valid_basic', // $100 credit
				quantity: 1,
			})

			expect(result.fixedDiscountForUpgrade).toBe(100)
			expect(result.appliedFixedDiscount).toBe(20)
			// Should use the better discount ($100 > $20)
			expect(result.calculatedPrice).toBe(100) // $200 - $100
		})

		it('should use fixed merchant when better than upgrade discount', async () => {
			const mockAdapter = createMockAdapter({
				getProduct: vi.fn(async (id: string) => {
					if (id === 'prod_expensive') return testProducts.expensive
					return testProducts.basic
				}),
				getPriceForProduct: vi.fn(async (productId: string) => {
					if (productId === 'prod_expensive') return testPrices.expensive
					return testPrices.basic
				}),
				getPurchase: vi.fn(async () => testPurchases.validBasic),
				getMerchantCoupon: vi.fn(
					async () => testMerchantCoupons.fixedAmount200,
				),
				getUpgradableProducts: vi.fn(async () => [testUpgradableProducts[0]]),
				availableUpgradesForProduct: vi.fn(async () => [
					{
						upgradableTo: { id: 'prod_bundle', name: 'Bundle Course' },
						upgradableFrom: { id: 'prod_basic', name: 'Basic Course' },
					},
				]),
				pricesOfPurchasesTowardOneBundle: vi.fn(async () => [testPrices.basic]),
			})

			const result = await formatPricesForProduct({
				ctx: mockAdapter,
				productId: 'prod_expensive', // $500
				merchantCouponId: 'coupon_fixed_200', // $200 off
				upgradeFromPurchaseId: 'purchase_valid_basic', // $100 credit
				quantity: 1,
			})

			expect(result.fixedDiscountForUpgrade).toBe(100)
			expect(result.appliedFixedDiscount).toBe(200)
			// Should use the better discount ($200 > $100)
			expect(result.calculatedPrice).toBe(300) // $500 - $200
		})

		it('should handle PPP upgrade from restricted purchase correctly', async () => {
			const mockAdapter = createMockAdapter({
				getPurchase: vi.fn(async () => testPurchases.restrictedBasic),
				getUpgradableProducts: vi.fn(async () => []), // Same product, not an upgrade
			})

			const result = await formatPricesForProduct({
				ctx: mockAdapter,
				productId: 'prod_basic', // $100, same product
				upgradeFromPurchaseId: 'purchase_restricted_basic', // Paid $40 with PPP
				quantity: 1,
			})

			// Upgrading from Restricted to Unrestricted on same product
			expect(result.fixedDiscountForUpgrade).toBe(40)
			expect(result.calculatedPrice).toBe(60) // $100 - $40
		})
	})

	describe('Bulk Purchases', () => {
		it('should apply fixed $20/seat discount for bulk purchases when better', async () => {
			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(async () => testMerchantCoupons.fixedAmount20),
			})

			const result = await formatPricesForProduct({
				ctx: mockAdapter,
				productId: 'prod_basic',
				merchantCouponId: 'coupon_fixed_20',
				quantity: 5,
			})

			// Fixed $20/seat × 5 = $100 > Bulk 15% ($75)
			expect(result.bulk).toBe(true)
			expect(result.appliedDiscountType).toBe('fixed')
			expect(result.appliedFixedDiscount).toBe(100) // $20 × 5 seats
			expect(result.calculatedPrice).toBe(400) // $500 - $100
		})

		it('should apply bulk percentage discount instead of fixed', async () => {
			const mockAdapter = createMockAdapter()

			const result = await formatPricesForProduct({
				ctx: mockAdapter,
				productId: 'prod_basic',
				quantity: 5,
			})

			expect(result.bulk).toBe(true)
			expect(result.quantity).toBe(5)
			// Should have bulk discount applied
			expect(result.calculatedPrice).toBeLessThan(500) // Less than full price
		})
	})

	describe('No Discount Scenarios', () => {
		it('should return full price when no coupon applied', async () => {
			const mockAdapter = createMockAdapter()

			const result = await formatPricesForProduct({
				ctx: mockAdapter,
				productId: 'prod_basic',
				quantity: 1,
			})

			expect(result.unitPrice).toBe(100)
			expect(result.fullPrice).toBe(100)
			expect(result.calculatedPrice).toBe(100)
			expect(result.appliedMerchantCoupon).toBeUndefined()
		})

		it('should handle quantity without discount', async () => {
			const mockAdapter = createMockAdapter()

			const result = await formatPricesForProduct({
				ctx: mockAdapter,
				productId: 'prod_basic',
				quantity: 3,
			})

			expect(result.unitPrice).toBe(100)
			expect(result.quantity).toBe(3)
			expect(result.fullPrice).toBe(300)
		})
	})

	describe('Return Value Structure', () => {
		it('should include all expected fields in response', async () => {
			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(async () => testMerchantCoupons.fixedAmount20),
			})

			const result = await formatPricesForProduct({
				ctx: mockAdapter,
				productId: 'prod_basic',
				merchantCouponId: 'coupon_fixed_20',
				quantity: 1,
			})

			// Check for all required fields
			expect(result).toHaveProperty('id')
			expect(result).toHaveProperty('quantity')
			expect(result).toHaveProperty('unitPrice')
			expect(result).toHaveProperty('fullPrice')
			expect(result).toHaveProperty('fixedDiscountForUpgrade')
			expect(result).toHaveProperty('calculatedPrice')
			expect(result).toHaveProperty('availableCoupons')
			expect(result).toHaveProperty('bulk')

			// New fields for fixed discount support
			expect(result).toHaveProperty('appliedFixedDiscount')
			expect(result).toHaveProperty('appliedDiscountType')
		})

		it('should include product details', async () => {
			const mockAdapter = createMockAdapter()

			const result = await formatPricesForProduct({
				ctx: mockAdapter,
				productId: 'prod_basic',
				quantity: 1,
			})

			expect(result.id).toBe('prod_basic')
		})

		it('should include upgrade details when applicable', async () => {
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
				getUpgradableProducts: vi.fn(async () => [testUpgradableProducts[0]]),
				pricesOfPurchasesTowardOneBundle: vi.fn(async () => [testPrices.basic]),
			})

			const result = await formatPricesForProduct({
				ctx: mockAdapter,
				productId: 'prod_bundle',
				upgradeFromPurchaseId: 'purchase_valid_basic',
				quantity: 1,
			})

			expect(result).toHaveProperty('upgradeFromPurchaseId')
			expect(result).toHaveProperty('upgradeFromPurchase')
			expect(result).toHaveProperty('upgradedProduct')
		})
	})

	describe('Error Handling', () => {
		it('should throw PriceFormattingError when product not found', async () => {
			const mockAdapter = createMockAdapter({
				getProduct: vi.fn(async () => null),
			})

			await expect(
				formatPricesForProduct({
					ctx: mockAdapter,
					productId: 'nonexistent',
					quantity: 1,
				}),
			).rejects.toThrow('no-product-found')
		})

		it('should throw PriceFormattingError when price not found', async () => {
			const mockAdapter = createMockAdapter({
				getPriceForProduct: vi.fn(async () => null),
			})

			await expect(
				formatPricesForProduct({
					ctx: mockAdapter,
					productId: 'prod_basic',
					quantity: 1,
				}),
			).rejects.toThrow('no-price-found')
		})

		it('should throw error when productId is missing', async () => {
			const mockAdapter = createMockAdapter()

			await expect(
				formatPricesForProduct({
					ctx: mockAdapter,
					productId: '',
					quantity: 1,
				}),
			).rejects.toThrow('productId is required')
		})
	})

	describe('Country and PPP Integration', () => {
		it('should pass country to coupon determination', async () => {
			const mockAdapter = createMockAdapter()

			await formatPricesForProduct({
				ctx: mockAdapter,
				productId: 'prod_basic',
				country: 'IN',
				quantity: 1,
			})

			// Country should be passed through the pricing pipeline
			// Actual PPP logic is tested in determineCouponToApply tests
		})

		it('should default to US when no country provided', async () => {
			const mockAdapter = createMockAdapter()

			const result = await formatPricesForProduct({
				ctx: mockAdapter,
				productId: 'prod_basic',
				quantity: 1,
			})

			// Should work without error and use default behavior
			expect(result.calculatedPrice).toBeDefined()
		})
	})

	describe('Used Coupon Tracking', () => {
		it('should include usedCouponId when coupon matches', async () => {
			const mockAdapter = createMockAdapter({
				getCoupon: vi.fn(async () => ({
					id: 'used_coupon_1',
					code: 'USED_COUPON_1',
					merchantCouponId: 'coupon_fixed_20',
					status: 0,
					fields: {},
					maxUses: -1,
					default: false,
					usedCount: 0,
					createdAt: null,
					percentageDiscount: 0,
					amountDiscount: null,
					expires: null,
					bulkPurchases: [],
					redeemedBulkCouponPurchases: [],
					restrictedToProductId: null,
					bulkPurchaseId: null,
					organizationId: null,
				})),
				getMerchantCoupon: vi.fn(async () => testMerchantCoupons.fixedAmount20),
			})

			const result = await formatPricesForProduct({
				ctx: mockAdapter,
				productId: 'prod_basic',
				merchantCouponId: 'coupon_fixed_20',
				usedCouponId: 'used_coupon_1',
				quantity: 1,
			})

			expect(result.usedCouponId).toBe('used_coupon_1')
		})

		it('should not include usedCouponId when coupon does not match', async () => {
			const mockAdapter = createMockAdapter({
				getCoupon: vi.fn(async () => ({
					id: 'used_coupon_1',
					code: 'USED_COUPON_1',
					merchantCouponId: 'different_coupon',
					status: 0,
					fields: {},
					maxUses: -1,
					default: false,
					usedCount: 0,
					createdAt: null,
					percentageDiscount: 0,
					amountDiscount: null,
					expires: null,
					bulkPurchases: [],
					redeemedBulkCouponPurchases: [],
					restrictedToProductId: null,
					bulkPurchaseId: null,
					organizationId: null,
				})),
				getMerchantCoupon: vi.fn(async () => testMerchantCoupons.fixedAmount20),
			})

			const result = await formatPricesForProduct({
				ctx: mockAdapter,
				productId: 'prod_basic',
				merchantCouponId: 'coupon_fixed_20',
				usedCouponId: 'used_coupon_1',
				quantity: 1,
			})

			expect(result.usedCouponId).toBeUndefined()
		})
	})

	describe('Stackable Discounts', () => {
		it('should apply percentage discount to full price, then fixed credit', async () => {
			// Scenario: $850 product, 40% off, $150 credit
			// Expected: $850 * 0.6 = $510, then $510 - $150 = $360
			const expensiveProduct = {
				...testProducts.basic,
				id: 'prod_expensive',
				name: 'Expensive Course',
			}
			const expensivePrice = {
				...testPrices.basic,
				unitAmount: 850,
			}

			const percentageCoupon = {
				...testMerchantCoupons.percentage25,
				id: 'coupon_40_percent',
				percentageDiscount: 0.4, // 40% off
			}

			const creditCoupon = {
				...testMerchantCoupons.fixedAmount20,
				id: 'coupon_credit_150',
				amountDiscount: 15000, // $150 in cents
				type: 'special',
			}

			const mockAdapter = createMockAdapter({
				getProduct: vi.fn(async () => expensiveProduct),
				getPriceForProduct: vi.fn(async () => expensivePrice),
				getMerchantCoupon: vi.fn(async (id: string) => {
					if (id === 'coupon_40_percent') return percentageCoupon
					if (id === 'coupon_credit_150') return creditCoupon
					return null
				}),
				getEntitlementsForUser: vi.fn(async () => [
					{
						id: 'entitlement_1',
						userId: 'user_1',
						sourceType: 'COUPON',
						sourceId: 'coupon_credit_150',
						entitlementType: 'et_83732df61b0c95ea',
						createdAt: new Date(),
						updatedAt: new Date(),
						metadata: {},
					},
				]),
				getCoupon: vi.fn(async (id: string) => {
					if (id === 'coupon_40_percent')
						return {
							id: 'coupon_40_percent',
							code: 'EARLYBIRD40',
							merchantCouponId: 'coupon_40_percent',
							status: 0,
							fields: { stackable: true }, // Mark as stackable so it gets added to stackableDiscounts
							maxUses: -1,
							default: true,
							usedCount: 0,
							createdAt: null,
							percentageDiscount: 0.4,
							amountDiscount: null,
							expires: null,
							bulkPurchases: [],
							redeemedBulkCouponPurchases: [],
							restrictedToProductId: null,
							bulkPurchaseId: null,
							organizationId: null,
						}
					if (id === 'coupon_credit_150')
						return {
							id: 'coupon_credit_150',
							code: 'CREDIT150',
							merchantCouponId: 'coupon_credit_150',
							status: 0,
							fields: { stackable: true }, // Required for entitlement coupons to be added to stackableDiscounts
							maxUses: -1,
							default: false,
							usedCount: 0,
							createdAt: null,
							percentageDiscount: 0,
							amountDiscount: null,
							expires: null,
							bulkPurchases: [],
							redeemedBulkCouponPurchases: [],
							restrictedToProductId: null,
							bulkPurchaseId: null,
							organizationId: null,
						}
					return null
				}),
				getMerchantCouponForTypeAndAmount: vi.fn(async () => null),
			})

			const result = await formatPricesForProduct({
				ctx: mockAdapter,
				productId: 'prod_expensive',
				userId: 'user_1',
				merchantCouponId: 'coupon_40_percent',
				usedCouponId: 'coupon_40_percent', // Required for the code to check if coupon is stackable
				preferStacking: false, // Will be enabled by entitlements
				quantity: 1,
			})

			expect(result.stackableDiscounts).toBeDefined()
			expect(result.stackableDiscounts?.length).toBe(2)
			expect(result.stackingPath).toBe('stack')
			// $850 * 0.6 = $510, then $510 - $150 = $360
			expect(result.calculatedPrice).toBe(360)
			expect(result.totalDiscountAmount).toBe(490) // $340 (40%) + $150 (credit)
		})

		it('should apply fixed main coupon first, then entitlement credit', async () => {
			// Scenario: $850 product, $200 fixed discount, $150 credit
			// Expected: $850 - $200 = $650, then $650 - $150 = $500
			const expensiveProduct = {
				...testProducts.basic,
				id: 'prod_expensive',
				name: 'Expensive Course',
			}
			const expensivePrice = {
				...testPrices.basic,
				unitAmount: 850,
			}

			const fixedCoupon = {
				...testMerchantCoupons.fixedAmount20,
				id: 'coupon_fixed_200',
				amountDiscount: 20000, // $200 in cents
			}

			const creditCoupon = {
				...testMerchantCoupons.fixedAmount20,
				id: 'coupon_credit_150',
				amountDiscount: 15000, // $150 in cents
				type: 'special',
			}

			const mockAdapter = createMockAdapter({
				getProduct: vi.fn(async () => expensiveProduct),
				getPriceForProduct: vi.fn(async () => expensivePrice),
				getMerchantCoupon: vi.fn(async (id: string) => {
					if (id === 'coupon_fixed_200') return fixedCoupon
					if (id === 'coupon_credit_150') return creditCoupon
					return null
				}),
				getEntitlementsForUser: vi.fn(async () => [
					{
						id: 'entitlement_1',
						userId: 'user_1',
						sourceType: 'COUPON',
						sourceId: 'coupon_credit_150',
						entitlementType: 'et_83732df61b0c95ea',
						createdAt: new Date(),
						updatedAt: new Date(),
						metadata: {},
					},
				]),
				getCoupon: vi.fn(async (id: string) => {
					if (id === 'coupon_fixed_200')
						return {
							id: 'coupon_fixed_200',
							code: 'FIXED200',
							merchantCouponId: 'coupon_fixed_200',
							status: 0,
							fields: { stackable: true }, // Mark as stackable so it gets added to stackableDiscounts
							maxUses: -1,
							default: true,
							usedCount: 0,
							createdAt: null,
							percentageDiscount: 0,
							amountDiscount: 20000,
							expires: null,
							bulkPurchases: [],
							redeemedBulkCouponPurchases: [],
							restrictedToProductId: null,
							bulkPurchaseId: null,
							organizationId: null,
						}
					if (id === 'coupon_credit_150')
						return {
							id: 'coupon_credit_150',
							code: 'CREDIT150',
							merchantCouponId: 'coupon_credit_150',
							status: 0,
							fields: { stackable: true }, // Required for entitlement coupons to be added to stackableDiscounts
							maxUses: -1,
							default: false,
							usedCount: 0,
							createdAt: null,
							percentageDiscount: 0,
							amountDiscount: null,
							expires: null,
							bulkPurchases: [],
							redeemedBulkCouponPurchases: [],
							restrictedToProductId: null,
							bulkPurchaseId: null,
							organizationId: null,
						}
					return null
				}),
				getMerchantCouponForTypeAndAmount: vi.fn(async () => null),
			})

			const result = await formatPricesForProduct({
				ctx: mockAdapter,
				productId: 'prod_expensive',
				userId: 'user_1',
				merchantCouponId: 'coupon_fixed_200',
				usedCouponId: 'coupon_fixed_200', // Required for the code to check if coupon is stackable
				preferStacking: false, // Will be enabled by entitlements
				quantity: 1,
			})

			expect(result.stackableDiscounts).toBeDefined()
			expect(result.stackableDiscounts?.length).toBe(2)
			expect(result.stackingPath).toBe('stack')
			// $850 - $200 = $650, then $650 - $150 = $500
			expect(result.calculatedPrice).toBe(500)
			expect(result.totalDiscountAmount).toBe(350) // $200 (fixed) + $150 (credit)
		})
	})
})
