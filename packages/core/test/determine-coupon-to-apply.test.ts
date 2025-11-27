import { describe, expect, it, vi } from 'vitest'

import { determineCouponToApply } from '../src/lib/pricing/determine-coupon-to-apply'
import { Coupon, MerchantCoupon } from '../src/schemas'
import {
	createMockAdapter,
	testMerchantCoupons,
	testPurchases,
} from './pricing-test-fixtures'

describe('determineCouponToApply', () => {
	describe('Fixed Amount Discount Detection', () => {
		it('should return appliedDiscountType as "fixed" for amount-based coupons', async () => {
			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(async () => testMerchantCoupons.fixedAmount20),
				getPurchasesForUser: vi.fn(async () => []),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				merchantCouponId: 'coupon_fixed_20',
				country: 'US',
				quantity: 1,
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				preferStacking: false,
				unitPrice: 100,
			})

			expect(result.appliedDiscountType).toBe('fixed')
			expect(result.appliedMerchantCoupon?.amountDiscount).toBe(2000)
		})

		it('should return appliedDiscountType as "percentage" for percentage coupons', async () => {
			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(async () => testMerchantCoupons.percentage25),
				getPurchasesForUser: vi.fn(async () => []),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				merchantCouponId: 'coupon_percent_25',
				country: 'US',
				quantity: 1,
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				preferStacking: false,
				unitPrice: 100,
			})

			expect(result.appliedDiscountType).toBe('percentage')
			expect(result.appliedMerchantCoupon?.percentageDiscount).toBe(0.25)
		})
	})

	describe('Discount Type Priority Logic', () => {
		it('should prefer fixed discount over no discount', async () => {
			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(async () => testMerchantCoupons.fixedAmount20),
				getPurchasesForUser: vi.fn(async () => []),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				merchantCouponId: 'coupon_fixed_20',
				country: 'US',
				quantity: 1,
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				preferStacking: false,
				unitPrice: 100,
			})

			expect(result.appliedMerchantCoupon).toBeDefined()
			expect(result.appliedDiscountType).toBe('fixed')
		})

		it('should prefer PPP over fixed when PPP is better', async () => {
			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(async () => testMerchantCoupons.fixedAmount20),
				getPurchasesForUser: vi.fn(async () => []),
				getMerchantCouponsForTypeAndPercent: vi.fn(async () => [
					testMerchantCoupons.ppp75,
				]),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				merchantCouponId: 'coupon_fixed_20',
				country: 'IN', // India has 75% PPP discount
				quantity: 1,
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				preferStacking: false,
				unitPrice: 100,
			})

			// PPP 75% on $100 = $25 final
			// Fixed $20 on $100 = $80 final
			// PPP is better, so should be preferred
			expect(result.appliedDiscountType).toBe('ppp')
			expect(result.appliedMerchantCoupon?.percentageDiscount).toBe(0.75)
		})

		it('should apply fixed $20/seat coupon over bulk 15% when per-seat is better', async () => {
			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(async () => testMerchantCoupons.fixedAmount20),
				getPurchasesForUser: vi.fn(async () => []),
				getMerchantCouponsForTypeAndPercent: vi.fn(async () => [
					testMerchantCoupons.bulk15,
				]),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				merchantCouponId: 'coupon_fixed_20',
				country: 'US',
				quantity: 5, // Bulk purchase
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				preferStacking: false,
				unitPrice: 100,
			})

			// Fixed $20/seat × 5 = $100 > Bulk 15% ($75)
			expect(result.bulk).toBe(true)
			expect(result.appliedDiscountType).toBe('fixed')
		})
	})

	describe('PPP Logic (Existing Functionality)', () => {
		it('should apply PPP discount when conditions are met', async () => {
			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(async () => null),
				getPurchasesForUser: vi.fn(async () => []),
				getMerchantCouponsForTypeAndPercent: vi.fn(async () => [
					testMerchantCoupons.ppp75,
				]),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				country: 'IN', // India
				quantity: 1,
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				preferStacking: false,
				unitPrice: 100,
			})

			expect(result.appliedDiscountType).toBe('ppp')
			expect(result.availableCoupons.length).toBeGreaterThan(0)
		})

		it('should not apply PPP when user has made a non-PPP purchase', async () => {
			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(async () => null),
				getPurchasesForUser: vi.fn(async () => [testPurchases.validBasic]),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				country: 'IN',
				quantity: 1,
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				preferStacking: false,
				unitPrice: 100,
			})

			expect(result.appliedDiscountType).toBe('none')
		})

		it('should not apply PPP when autoApplyPPP is false', async () => {
			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(async () => null),
				getPurchasesForUser: vi.fn(async () => []),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				country: 'IN',
				quantity: 1,
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: false,
				preferStacking: false,
				unitPrice: 100,
			})

			expect(result.appliedDiscountType).toBe('none')
		})

		it('should not apply PPP for bulk purchases', async () => {
			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(async () => null),
				getPurchasesForUser: vi.fn(async () => []),
				getMerchantCouponsForTypeAndPercent: vi.fn(async () => [
					testMerchantCoupons.bulk15,
				]),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				country: 'IN',
				quantity: 5, // Bulk
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				preferStacking: false,
				unitPrice: 100,
			})

			expect(result.appliedDiscountType).not.toBe('ppp')
			expect(result.bulk).toBe(true)
		})
	})

	describe('Bulk Discount Logic (Existing Functionality)', () => {
		it('should apply bulk discount for quantity > 1', async () => {
			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(async () => null),
				getPurchasesForUser: vi.fn(async () => []),
				getMerchantCouponsForTypeAndPercent: vi.fn(async () => [
					testMerchantCoupons.bulk15,
				]),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				country: 'US',
				quantity: 5,
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				preferStacking: false,
				unitPrice: 100,
			})

			expect(result.bulk).toBe(true)
			expect(result.appliedDiscountType).toBe('bulk')
			expect(result.appliedMerchantCoupon?.percentageDiscount).toBe(0.15)
		})

		it('should not apply bulk discount when merchant percentage is better', async () => {
			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(async () => testMerchantCoupons.percentage25),
				getPurchasesForUser: vi.fn(async () => []),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				merchantCouponId: 'coupon_percent_25', // 25% off
				country: 'US',
				quantity: 5, // Would normally trigger 20% bulk discount
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				preferStacking: false,
				unitPrice: 100,
			})

			// Merchant 25% is better than bulk 15%, so should use merchant
			expect(result.appliedDiscountType).toBe('percentage')
			expect(result.appliedMerchantCoupon?.percentageDiscount).toBe(0.25)
		})
	})

	describe('Special Merchant Coupons', () => {
		it('should apply special merchant coupon when provided', async () => {
			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(async () => testMerchantCoupons.percentage25),
				getPurchasesForUser: vi.fn(async () => []),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				merchantCouponId: 'coupon_percent_25',
				country: 'US',
				quantity: 1,
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				preferStacking: false,
				unitPrice: 100,
			})

			expect(result.appliedMerchantCoupon).toBeDefined()
			expect(result.appliedDiscountType).toBe('percentage')
		})

		it('should handle special type fixed amount coupons', async () => {
			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(async () => testMerchantCoupons.fixedAmount20),
				getPurchasesForUser: vi.fn(async () => []),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				merchantCouponId: 'coupon_fixed_20',
				country: 'US',
				quantity: 1,
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				preferStacking: false,
				unitPrice: 100,
			})

			expect(result.appliedMerchantCoupon?.type).toBe('special')
			expect(result.appliedDiscountType).toBe('fixed')
		})
	})

	describe('Used Coupon Restrictions', () => {
		it('should not apply coupon when restricted to different product', async () => {
			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(async () => testMerchantCoupons.percentage25),
				getPurchasesForUser: vi.fn(async () => []),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				merchantCouponId: 'coupon_percent_25',
				country: 'US',
				quantity: 1,
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				preferStacking: false,
				unitPrice: 100,
				usedCoupon: {
					merchantCouponId: 'coupon_percent_25',
					restrictedToProductId: 'different_product',
				},
			})

			expect(result.appliedMerchantCoupon).toBeUndefined()
			expect(result.appliedDiscountType).toBe('none')
		})

		it('should apply coupon when restricted to same product', async () => {
			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(async () => testMerchantCoupons.percentage25),
				getPurchasesForUser: vi.fn(async () => []),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				merchantCouponId: 'coupon_percent_25',
				country: 'US',
				quantity: 1,
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				preferStacking: false,
				unitPrice: 100,
				usedCoupon: {
					merchantCouponId: 'coupon_percent_25',
					restrictedToProductId: 'prod_basic',
				},
			})

			expect(result.appliedMerchantCoupon).toBeDefined()
		})
	})

	describe('Return Value Structure', () => {
		it('should include appliedDiscountType in return value', async () => {
			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(async () => testMerchantCoupons.fixedAmount20),
				getPurchasesForUser: vi.fn(async () => []),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				merchantCouponId: 'coupon_fixed_20',
				country: 'US',
				quantity: 1,
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				preferStacking: false,
				unitPrice: 100,
			})

			expect(result).toHaveProperty('appliedMerchantCoupon')
			expect(result).toHaveProperty('appliedCouponType')
			expect(result).toHaveProperty('appliedDiscountType')
			expect(result).toHaveProperty('availableCoupons')
			expect(result).toHaveProperty('bulk')
		})

		it('should return none when no discount applies', async () => {
			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(async () => null),
				getPurchasesForUser: vi.fn(async () => []),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				country: 'US',
				quantity: 1,
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				preferStacking: false,
				unitPrice: 100,
			})

			expect(result.appliedDiscountType).toBe('none')
			expect(result.appliedMerchantCoupon).toBeUndefined()
			expect(result.bulk).toBe(false)
		})

		it('should return available coupons list', async () => {
			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(async () => null),
				getPurchasesForUser: vi.fn(async () => []),
				getMerchantCouponsForTypeAndPercent: vi.fn(async () => [
					testMerchantCoupons.ppp75,
				]),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				country: 'IN',
				quantity: 1,
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				preferStacking: false,
				unitPrice: 100,
			})

			expect(Array.isArray(result.availableCoupons)).toBe(true)
			if (result.appliedDiscountType === 'ppp') {
				expect(result.availableCoupons.length).toBeGreaterThan(0)
			}
		})
	})

	describe('Edge Cases', () => {
		it('should handle zero amount discount as no discount', async () => {
			const zeroAmountCoupon = {
				...testMerchantCoupons.fixedAmount20,
				amountDiscount: 0,
			}
			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(async () => zeroAmountCoupon),
				getPurchasesForUser: vi.fn(async () => []),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				merchantCouponId: 'coupon_zero',
				country: 'US',
				quantity: 1,
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				preferStacking: false,
				unitPrice: 100,
			})

			expect(result.appliedDiscountType).toBe('none')
		})

		it('should handle undefined merchantCouponId', async () => {
			const mockAdapter = createMockAdapter({
				getPurchasesForUser: vi.fn(async () => []),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				country: 'US',
				quantity: 1,
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				preferStacking: false,
				unitPrice: 100,
			})

			expect(result.appliedMerchantCoupon).toBeUndefined()
		})

		it('should handle null purchase correctly', async () => {
			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(async () => testMerchantCoupons.fixedAmount20),
				getPurchasesForUser: vi.fn(async () => []),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				merchantCouponId: 'coupon_fixed_20',
				country: 'US',
				quantity: 1,
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				preferStacking: false,
				unitPrice: 100,
			})

			expect(result).toBeDefined()
			expect(result.appliedDiscountType).toBe('fixed')
		})
	})

	describe('Stackable Discounts and preferStacking', () => {
		it('should default preferStacking to false', async () => {
			const mockAdapter = createMockAdapter({
				getPurchasesForUser: vi.fn(async () => []),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				merchantCouponId: undefined,
				country: 'US',
				quantity: 1,
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				preferStacking: false,
				unitPrice: 100,
			})

			expect(result.stackableDiscounts).toEqual([])
			expect(result.stackingPath).toBe('none')
		})

		it('should enable stacking when user has entitlement-based coupons', async () => {
			const entitlementType =
				await createMockAdapter().getEntitlementTypeByName(
					'apply_special_credit',
				)
			const entitlementTypeId = entitlementType?.id || 'et_test_123'

			const mockAdapter = createMockAdapter({
				getPurchasesForUser: vi.fn(async () => []),
				getEntitlementsForUser: vi.fn(async () => [
					{
						id: 'entitlement_1',
						entitlementType: entitlementTypeId,
						userId: 'user_1',
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
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				merchantCouponId: undefined,
				country: 'US',
				quantity: 1,
				userId: 'user_1',
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				preferStacking: false, // Explicitly false, but should be enabled by entitlements
				unitPrice: 100,
			})

			// Should have stackable discounts even though preferStacking was false
			expect(result.stackableDiscounts.length).toBeGreaterThan(0)
			expect(result.stackingPath).toBe('stack')
		})

		it('should not enable stacking when user has no entitlements', async () => {
			const mockAdapter = createMockAdapter({
				getPurchasesForUser: vi.fn(async () => []),
				getEntitlementsForUser: vi.fn(async () => []), // No entitlements
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				merchantCouponId: undefined,
				country: 'US',
				quantity: 1,
				userId: 'user_no_entitlements',
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				preferStacking: false,
				unitPrice: 100,
			})

			expect(result.stackableDiscounts).toEqual([])
			expect(result.stackingPath).toBe('none')
		})

		it('should stack PPP with credits when both are available', async () => {
			// Get the entitlement type ID dynamically
			const entitlementType =
				await createMockAdapter().getEntitlementTypeByName(
					'apply_special_credit',
				)
			const entitlementTypeId = entitlementType?.id || 'et_test_123'

			const mockAdapter = createMockAdapter({
				getPurchasesForUser: vi.fn(async () => []), // No valid purchases = PPP eligible
				getEntitlementsForUser: vi.fn(async () => [
					{
						id: 'entitlement_1',
						entitlementType: entitlementTypeId,
						userId: 'user_ppp',
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
				getMerchantCoupon: vi.fn(async (id: string) => {
					if (id === 'merchant_coupon_credit_150') {
						return {
							id: 'merchant_coupon_credit_150',
							identifier: 'stripe_coupon_credit_150',
							amountDiscount: 15000,
							type: 'special credit',
							status: 1,
							merchantAccountId: 'merchant_1',
						}
					}
					return null
				}),
				getMerchantCouponsForTypeAndPercent: vi.fn(async () => [
					{
						id: 'merchant_coupon_ppp',
						identifier: 'stripe_coupon_ppp',
						percentageDiscount: 0.75,
						type: 'ppp',
						status: 1,
						merchantAccountId: 'merchant_1',
					},
				]),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				merchantCouponId: undefined,
				country: 'IN', // India = PPP eligible
				quantity: 1,
				userId: 'user_ppp',
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				preferStacking: true, // Enable stacking - PPP + Credit CAN stack
				unitPrice: 100,
			})

			// With new rules: PPP + Credit CAN stack, so should use stack path
			expect(result.stackingPath).toBe('stack')
			expect(result.stackableDiscounts.length).toBeGreaterThan(0)
			// PPP should be in stackableDiscounts with source 'ppp'
			const pppDiscount = result.stackableDiscounts.find(
				(d) => d.source === 'ppp',
			)
			expect(pppDiscount).toBeDefined()
			// Credit should also be in stackableDiscounts
			const creditDiscount = result.stackableDiscounts.find(
				(d) => d.source === 'entitlement',
			)
			expect(creditDiscount).toBeDefined()
		})

		it('should stack discounts when preferStacking is true and no PPP', async () => {
			// Get the entitlement type ID dynamically
			const entitlementType =
				await createMockAdapter().getEntitlementTypeByName(
					'apply_special_credit',
				)
			const entitlementTypeId = entitlementType?.id || 'et_test_123'

			const mockAdapter = createMockAdapter({
				getPurchasesForUser: vi.fn(async () => [
					testPurchases.validBasic, // Has valid purchase = not PPP eligible
				]),
				getEntitlementsForUser: vi.fn(async () => [
					{
						id: 'entitlement_1',
						entitlementType: entitlementTypeId,
						userId: 'user_1',
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
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				merchantCouponId: undefined,
				country: 'US',
				quantity: 1,
				userId: 'user_1',
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				preferStacking: true,
				unitPrice: 100,
			})

			expect(result.stackingPath).toBe('stack')
			expect(result.stackableDiscounts.length).toBeGreaterThan(0)
		})

		it('should exclude entitlement-based credits when quantity > 1 (team purchase)', async () => {
			const entitlementType =
				await createMockAdapter().getEntitlementTypeByName(
					'apply_special_credit',
				)
			const entitlementTypeId = entitlementType?.id || 'et_test_123'

			const mockAdapter = createMockAdapter({
				getPurchasesForUser: vi.fn(async () => []),
				getEntitlementsForUser: vi.fn(async () => [
					{
						id: 'entitlement_1',
						entitlementType: entitlementTypeId,
						userId: 'user_1',
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
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				merchantCouponId: undefined,
				country: 'US',
				quantity: 5,
				userId: 'user_1',
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				preferStacking: false,
				unitPrice: 100,
			})

			expect(result.stackableDiscounts).toEqual([])
			expect(result.bulk).toBe(true)
		})

		it('should exclude entitlement-based credits when user has existing bulk purchase (consideredBulk = true)', async () => {
			const entitlementType =
				await createMockAdapter().getEntitlementTypeByName(
					'apply_special_credit',
				)
			const entitlementTypeId = entitlementType?.id || 'et_test_123'

			const mockAdapter = createMockAdapter({
				getPurchasesForUser: vi.fn(async () => [
					{
						id: 'purchase_bulk_1',
						productId: 'prod_basic',
						userId: 'user_1',
						status: 'Valid',
						fields: {},
						bulkCoupon: {
							id: 'bulk_coupon_1',
							code: 'BULK5',
							maxUses: 5,
							usedCount: 2,
							status: 0,
							default: false,
							createdAt: new Date(),
							expires: null,
							fields: {},
							percentageDiscount: 0,
							merchantCouponId: null,
							bulkPurchases: [],
							redeemedBulkCouponPurchases: [],
						},
						createdAt: new Date(),
						totalAmount: 500,
					},
				]),
				getEntitlementsForUser: vi.fn(async () => [
					{
						id: 'entitlement_1',
						entitlementType: entitlementTypeId,
						userId: 'user_1',
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
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				merchantCouponId: undefined,
				country: 'US',
				quantity: 1,
				userId: 'user_1',
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				preferStacking: false,
				unitPrice: 100,
			})

			// Entitlement-based credits should be excluded when consideredBulk = true
			// (user has existing bulk purchase, so seatCount = 1 + 5 = 6 > 1)
			expect(result.stackableDiscounts).toEqual([])
			expect(result.bulk).toBe(true)
		})
	})

	describe('URL Coupon Stacking Logic', () => {
		it('should stack URL coupon from usedCoupon (not merchantCouponId) with special credits when entitlements exist', async () => {
			// This test covers the bug fix: coupon from URL params via usedCoupon should stack with entitlements
			const entitlementType =
				await createMockAdapter().getEntitlementTypeByName(
					'apply_special_credit',
				)
			const entitlementTypeId = entitlementType?.id || 'et_test_123'

			const mockAdapter = createMockAdapter({
				getPurchasesForUser: vi.fn(async () => [testPurchases.validBasic]),
				getEntitlementsForUser: vi.fn(async () => [
					{
						id: 'entitlement_1',
						entitlementType: entitlementTypeId,
						userId: 'user_1',
						sourceType: 'COUPON',
						sourceId: 'coupon_credit_149',
						metadata: {},
					},
				]),
				getCoupon: vi.fn(async (id: string) => {
					if (id === 'coupon_url_40') {
						return {
							id: 'coupon_url_40',
							code: 'URL40',
							merchantCouponId: 'merchant_coupon_url_40',
							status: 0,
							fields: {}, // Not explicitly disabled, so should stack
							maxUses: -1,
							default: false,
							usedCount: 0,
							createdAt: new Date(),
							percentageDiscount: 0,
							expires: null,
							bulkPurchases: [],
							redeemedBulkCouponPurchases: [],
						} as Coupon
					}
					return {
						id: 'coupon_credit_149',
						code: 'CREDIT149',
						merchantCouponId: 'merchant_coupon_credit_149',
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
					} as Coupon
				}),
				getMerchantCoupon: vi.fn(async (id: string) => {
					if (id === 'merchant_coupon_url_40') {
						return {
							id: 'merchant_coupon_url_40',
							identifier: 'stripe_coupon_url_40',
							percentageDiscount: 0.4, // 40% off
							type: 'special',
							status: 1,
							merchantAccountId: 'merchant_1',
						} as MerchantCoupon
					}
					return {
						id: 'merchant_coupon_credit_149',
						identifier: 'stripe_coupon_credit_149',
						amountDiscount: 14900, // $149 credit
						type: 'special credit',
						status: 1,
						merchantAccountId: 'merchant_1',
					} as MerchantCoupon
				}),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				// No merchantCouponId - coupon comes from URL params via usedCoupon
				merchantCouponId: undefined,
				usedCouponId: 'coupon_url_40', // URL param coupon
				usedCoupon: {
					merchantCouponId: 'merchant_coupon_url_40', // Coupon ID is in usedCoupon
					restrictedToProductId: null,
				},
				country: 'US',
				quantity: 1,
				userId: 'user_1',
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				preferStacking: false, // Should be enabled by entitlements
				unitPrice: 795, // $795 base price
			})

			// Should enable stacking because entitlements exist
			expect(result.stackingPath).toBe('stack')
			expect(result.stackableDiscounts.length).toBe(2) // Both coupon and credit

			// Credit should be in stackableDiscounts
			const creditDiscount = result.stackableDiscounts.find(
				(d) => d.source === 'entitlement',
			)
			expect(creditDiscount).toBeDefined()
			expect(creditDiscount?.discountType).toBe('fixed')
			expect(creditDiscount?.amount).toBe(14900) // $149

			// URL coupon should be in stackableDiscounts with source 'user'
			const urlCouponInStack = result.stackableDiscounts.find(
				(d) => d.source === 'user' && d.couponId === 'coupon_url_40',
			)
			expect(urlCouponInStack).toBeDefined()
			expect(urlCouponInStack?.discountType).toBe('percentage')
			expect(urlCouponInStack?.amount).toBe(0.4) // 40%
		})

		it('should stack URL coupon (type special) with special credits when entitlements exist', async () => {
			const entitlementType =
				await createMockAdapter().getEntitlementTypeByName(
					'apply_special_credit',
				)
			const entitlementTypeId = entitlementType?.id || 'et_test_123'

			const mockAdapter = createMockAdapter({
				getPurchasesForUser: vi.fn(async () => [testPurchases.validBasic]),
				getEntitlementsForUser: vi.fn(async () => [
					{
						id: 'entitlement_1',
						entitlementType: entitlementTypeId,
						userId: 'user_1',
						sourceType: 'COUPON',
						sourceId: 'coupon_credit_150',
						metadata: {},
					},
				]),
				getCoupon: vi.fn(async (id: string) => {
					if (id === 'coupon_url_40') {
						return {
							id: 'coupon_url_40',
							code: 'URL40',
							merchantCouponId: 'merchant_coupon_url_40',
							status: 0,
							fields: {},
							maxUses: -1,
							default: false,
							usedCount: 0,
							createdAt: new Date(),
							percentageDiscount: 0,
							expires: null,
							bulkPurchases: [],
							redeemedBulkCouponPurchases: [],
						} as Coupon
					}
					return {
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
					} as Coupon
				}),
				getMerchantCoupon: vi.fn(async (id: string) => {
					if (id === 'merchant_coupon_url_40') {
						return {
							id: 'merchant_coupon_url_40',
							identifier: 'stripe_coupon_url_40',
							percentageDiscount: 0.4,
							type: 'special',
							status: 1,
							merchantAccountId: 'merchant_1',
						} as MerchantCoupon
					}
					return {
						id: 'merchant_coupon_credit_150',
						identifier: 'stripe_coupon_credit_150',
						amountDiscount: 15000,
						type: 'special credit',
						status: 1,
						merchantAccountId: 'merchant_1',
					} as MerchantCoupon
				}),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				merchantCouponId: 'merchant_coupon_url_40',
				usedCouponId: 'coupon_url_40', // URL param coupon
				country: 'US',
				quantity: 1,
				userId: 'user_1',
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				preferStacking: true,
				unitPrice: 100,
			})

			expect(result.stackingPath).toBe('stack')
			expect(result.stackableDiscounts.length).toBe(2) // Both credit and URL coupon

			// Credit should be in stackableDiscounts
			const specialCreditInStack = result.stackableDiscounts.find(
				(d) => d.couponId === 'coupon_credit_150',
			)
			expect(specialCreditInStack).toBeDefined()
			expect(specialCreditInStack?.source).toBe('entitlement')

			// URL coupon should ALWAYS be in stackableDiscounts when entitlements exist
			const urlCouponInStack = result.stackableDiscounts.find(
				(d) => d.couponId === 'coupon_url_40',
			)
			expect(urlCouponInStack).toBeDefined()
			expect(urlCouponInStack?.source).toBe('user')
			expect(urlCouponInStack?.discountType).toBe('percentage')
			expect(urlCouponInStack?.amount).toBe(0.4)
		})

		it('should NOT stack URL coupon when stackable field is explicitly false', async () => {
			const entitlementType =
				await createMockAdapter().getEntitlementTypeByName(
					'apply_special_credit',
				)
			const entitlementTypeId = entitlementType?.id || 'et_test_123'

			const mockAdapter = createMockAdapter({
				getPurchasesForUser: vi.fn(async () => [testPurchases.validBasic]),
				getEntitlementsForUser: vi.fn(async () => [
					{
						id: 'entitlement_1',
						entitlementType: entitlementTypeId,
						userId: 'user_1',
						sourceType: 'COUPON',
						sourceId: 'coupon_credit_150',
						metadata: {},
					},
				]),
				getCoupon: vi.fn(async (id: string) => {
					if (id === 'coupon_url_40') {
						return {
							id: 'coupon_url_40',
							code: 'URL40',
							merchantCouponId: 'merchant_coupon_url_40',
							status: 0,
							fields: { stackable: false },
							maxUses: -1,
							default: false,
							usedCount: 0,
							createdAt: new Date(),
							percentageDiscount: 0,
							expires: null,
							bulkPurchases: [],
							redeemedBulkCouponPurchases: [],
						} as Coupon
					}
					return {
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
					} as Coupon
				}),
				getMerchantCoupon: vi.fn(async (id: string) => {
					if (id === 'merchant_coupon_url_40') {
						return {
							id: 'merchant_coupon_url_40',
							identifier: 'stripe_coupon_url_40',
							percentageDiscount: 0.4,
							type: 'special',
							status: 1,
							merchantAccountId: 'merchant_1',
						} as MerchantCoupon
					}
					return {
						id: 'merchant_coupon_credit_150',
						identifier: 'stripe_coupon_credit_150',
						amountDiscount: 15000,
						type: 'special credit',
						status: 1,
						merchantAccountId: 'merchant_1',
					} as MerchantCoupon
				}),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				merchantCouponId: 'merchant_coupon_url_40',
				usedCouponId: 'coupon_url_40',
				country: 'US',
				quantity: 1,
				userId: 'user_1',
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				preferStacking: false,
				unitPrice: 100,
			})

			const urlCouponInStack = result.stackableDiscounts.find(
				(d) => d.couponId === 'coupon_url_40',
			)
			expect(urlCouponInStack).toBeUndefined()

			expect(result.stackableDiscounts.length).toBe(1)
			expect(result.stackableDiscounts[0].couponId).toBe('coupon_credit_150')
		})

		it('should stack default coupon (default === true) with special credits when entitlements exist', async () => {
			const entitlementType =
				await createMockAdapter().getEntitlementTypeByName(
					'apply_special_credit',
				)
			const entitlementTypeId = entitlementType?.id || 'et_test_123'

			const mockAdapter = createMockAdapter({
				getPurchasesForUser: vi.fn(async () => [testPurchases.validBasic]),
				getEntitlementsForUser: vi.fn(async () => [
					{
						id: 'entitlement_1',
						entitlementType: entitlementTypeId,
						userId: 'user_1',
						sourceType: 'COUPON',
						sourceId: 'coupon_credit_150',
						metadata: {},
					},
				]),
				getCoupon: vi.fn(async (id: string) => {
					if (id === 'coupon_default_40') {
						return {
							id: 'coupon_default_40',
							code: 'DEFAULT40',
							merchantCouponId: 'merchant_coupon_default_40',
							status: 0,
							fields: {},
							maxUses: -1,
							default: true,
							usedCount: 0,
							createdAt: new Date(),
							percentageDiscount: 0,
							expires: null,
							bulkPurchases: [],
							redeemedBulkCouponPurchases: [],
						} as Coupon
					}
					return {
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
					} as Coupon
				}),
				getMerchantCoupon: vi.fn(async (id: string) => {
					if (id === 'merchant_coupon_default_40') {
						return {
							id: 'merchant_coupon_default_40',
							identifier: 'stripe_coupon_default_40',
							percentageDiscount: 0.4,
							type: 'special',
							status: 1,
							merchantAccountId: 'merchant_1',
						} as MerchantCoupon
					}
					return {
						id: 'merchant_coupon_credit_150',
						identifier: 'stripe_coupon_credit_150',
						amountDiscount: 15000,
						type: 'special credit',
						status: 1,
						merchantAccountId: 'merchant_1',
					} as MerchantCoupon
				}),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				merchantCouponId: 'merchant_coupon_default_40',
				usedCouponId: 'coupon_default_40',
				country: 'US',
				quantity: 1,
				userId: 'user_1',
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				preferStacking: false,
				unitPrice: 100,
			})

			// Default coupon should stack when entitlements exist
			expect(result.stackableDiscounts.length).toBe(2)
			expect(result.stackingPath).toBe('stack')

			const defaultCouponInStack = result.stackableDiscounts.find(
				(d) => d.couponId === 'coupon_default_40',
			)
			expect(defaultCouponInStack).toBeDefined()
			expect(defaultCouponInStack?.source).toBe('default')
		})

		it('should NOT stack URL coupon when no entitlements exist', async () => {
			const mockAdapter = createMockAdapter({
				getPurchasesForUser: vi.fn(async () => [testPurchases.validBasic]),
				getEntitlementsForUser: vi.fn(async () => []), // No entitlements
				getCoupon: vi.fn(async (id: string) => {
					if (id === 'coupon_url_40') {
						return {
							id: 'coupon_url_40',
							code: 'URL40',
							merchantCouponId: 'merchant_coupon_url_40',
							status: 0,
							fields: {},
							maxUses: -1,
							default: false,
							usedCount: 0,
							createdAt: new Date(),
							percentageDiscount: 0,
							expires: null,
							bulkPurchases: [],
							redeemedBulkCouponPurchases: [],
						} as Coupon
					}
					return null
				}),
				getMerchantCoupon: vi.fn(async (id: string) => {
					if (id === 'merchant_coupon_url_40') {
						return {
							id: 'merchant_coupon_url_40',
							identifier: 'stripe_coupon_url_40',
							percentageDiscount: 0.4,
							type: 'special',
							status: 1,
							merchantAccountId: 'merchant_1',
						} as MerchantCoupon
					}
					return null
				}),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				merchantCouponId: 'merchant_coupon_url_40',
				usedCouponId: 'coupon_url_40',
				country: 'US',
				quantity: 1,
				userId: 'user_1',
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				preferStacking: false,
				unitPrice: 100,
			})

			// Should not stack when no entitlements exist
			expect(result.stackableDiscounts).toEqual([])
			expect(result.stackingPath).toBe('none')
		})
	})

	describe('Stacking Rules', () => {
		/**
		 * NEW STACKING RULES:
		 * - Credit + Default = CAN stack ✅
		 * - Credit + PPP = CAN stack ✅
		 * - PPP + Default = CANNOT stack ❌ (NEVER ALLOWED)
		 * - PPP + Default + Credit = CANNOT stack ❌ (NEVER ALLOWED)
		 */

		it('✅ SHOULD ALLOW: Credit + Default can stack together', async () => {
			const entitlementType =
				await createMockAdapter().getEntitlementTypeByName(
					'apply_special_credit',
				)
			const entitlementTypeId = entitlementType?.id || 'et_test_123'

			const mockAdapter = createMockAdapter({
				getPurchasesForUser: vi.fn(async () => [testPurchases.validBasic]), // Has purchase = not PPP eligible
				getEntitlementsForUser: vi.fn(async () => [
					{
						id: 'entitlement_1',
						entitlementType: entitlementTypeId,
						userId: 'user_1',
						sourceType: 'COUPON',
						sourceId: 'coupon_credit_150',
						metadata: {},
					},
				]),
				getCoupon: vi.fn(async (id: string) => {
					if (id === 'coupon_default_40') {
						return {
							id: 'coupon_default_40',
							code: 'DEFAULT40',
							merchantCouponId: 'merchant_coupon_default_40',
							status: 0,
							fields: {},
							maxUses: -1,
							default: true, // Default coupon
							usedCount: 0,
							createdAt: new Date(),
							percentageDiscount: 0,
							expires: null,
							bulkPurchases: [],
							redeemedBulkCouponPurchases: [],
						} as Coupon
					}
					return {
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
					} as Coupon
				}),
				getMerchantCoupon: vi.fn(async (id: string) => {
					if (id === 'merchant_coupon_default_40') {
						return {
							id: 'merchant_coupon_default_40',
							identifier: 'stripe_coupon_default_40',
							percentageDiscount: 0.4,
							type: 'special',
							status: 1,
							merchantAccountId: 'merchant_1',
						} as MerchantCoupon
					}
					return {
						id: 'merchant_coupon_credit_150',
						identifier: 'stripe_coupon_credit_150',
						amountDiscount: 15000,
						type: 'special credit',
						status: 1,
						merchantAccountId: 'merchant_1',
					} as MerchantCoupon
				}),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				merchantCouponId: 'merchant_coupon_default_40',
				usedCouponId: 'coupon_default_40',
				country: 'US',
				quantity: 1,
				userId: 'user_1',
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				preferStacking: true,
				unitPrice: 100,
			})

			// Credit + Default SHOULD stack
			expect(result.stackingPath).toBe('stack')
			expect(result.stackableDiscounts.length).toBe(2)

			const defaultDiscount = result.stackableDiscounts.find(
				(d) => d.source === 'default',
			)
			expect(defaultDiscount).toBeDefined()
			expect(defaultDiscount?.discountType).toBe('percentage')
			expect(defaultDiscount?.amount).toBe(0.4)

			const creditDiscount = result.stackableDiscounts.find(
				(d) => d.source === 'entitlement',
			)
			expect(creditDiscount).toBeDefined()
			expect(creditDiscount?.discountType).toBe('fixed')
		})

		it('✅ SHOULD ALLOW: Credit + PPP can stack together', async () => {
			const entitlementType =
				await createMockAdapter().getEntitlementTypeByName(
					'apply_special_credit',
				)
			const entitlementTypeId = entitlementType?.id || 'et_test_123'

			const mockAdapter = createMockAdapter({
				getPurchasesForUser: vi.fn(async () => []), // No valid purchases = PPP eligible
				getEntitlementsForUser: vi.fn(async () => [
					{
						id: 'entitlement_1',
						entitlementType: entitlementTypeId,
						userId: 'user_1',
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
				getMerchantCoupon: vi.fn(async (id: string) => {
					if (id === 'merchant_coupon_credit_150') {
						return {
							id: 'merchant_coupon_credit_150',
							identifier: 'stripe_coupon_credit_150',
							amountDiscount: 15000,
							type: 'special credit',
							status: 1,
							merchantAccountId: 'merchant_1',
						}
					}
					return null
				}),
				getMerchantCouponsForTypeAndPercent: vi.fn(async () => [
					{
						id: 'merchant_coupon_ppp',
						identifier: 'stripe_coupon_ppp',
						percentageDiscount: 0.75,
						type: 'ppp',
						status: 1,
						merchantAccountId: 'merchant_1',
					},
				]),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				merchantCouponId: undefined,
				country: 'IN', // India = PPP eligible
				quantity: 1,
				userId: 'user_1',
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				preferStacking: false, // Prefer PPP, but PPP + Credit CAN stack
				unitPrice: 100,
			})

			// Credit + PPP SHOULD stack
			expect(result.stackingPath).toBe('stack')
			expect(result.stackableDiscounts.length).toBe(2)

			const pppDiscount = result.stackableDiscounts.find(
				(d) => d.source === 'ppp',
			)
			expect(pppDiscount).toBeDefined()
			expect(pppDiscount?.discountType).toBe('percentage')
			expect(pppDiscount?.amount).toBe(0.75)

			const creditDiscount = result.stackableDiscounts.find(
				(d) => d.source === 'entitlement',
			)
			expect(creditDiscount).toBeDefined()
			expect(creditDiscount?.discountType).toBe('fixed')
		})

		it('❌ MUST PREVENT: PPP + Default CANNOT stack together (NEVER ALLOWED)', async () => {
			// When both PPP and Default are available but no credits,
			// the system should choose one (PPP when preferStacking is false)
			const mockAdapter = createMockAdapter({
				getPurchasesForUser: vi.fn(async () => []), // No valid purchases = PPP eligible
				getEntitlementsForUser: vi.fn(async () => []), // No credits
				getCoupon: vi.fn(async (id: string) => {
					if (id === 'coupon_default_40') {
						return {
							id: 'coupon_default_40',
							code: 'DEFAULT40',
							merchantCouponId: 'merchant_coupon_default_40',
							status: 0,
							fields: {},
							maxUses: -1,
							default: true,
							usedCount: 0,
							createdAt: new Date(),
							percentageDiscount: 0,
							expires: null,
							bulkPurchases: [],
							redeemedBulkCouponPurchases: [],
						} as Coupon
					}
					return null
				}),
				getMerchantCoupon: vi.fn(async (id: string) => {
					if (id === 'merchant_coupon_default_40') {
						return {
							id: 'merchant_coupon_default_40',
							identifier: 'stripe_coupon_default_40',
							percentageDiscount: 0.4,
							type: 'special',
							status: 1,
							merchantAccountId: 'merchant_1',
						} as MerchantCoupon
					}
					return null
				}),
				getMerchantCouponsForTypeAndPercent: vi.fn(async () => [
					{
						id: 'merchant_coupon_ppp',
						identifier: 'stripe_coupon_ppp',
						percentageDiscount: 0.75,
						type: 'ppp',
						status: 1,
						merchantAccountId: 'merchant_1',
					},
				]),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				merchantCouponId: 'merchant_coupon_default_40',
				usedCouponId: 'coupon_default_40',
				country: 'IN',
				quantity: 1,
				userId: 'user_1',
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				preferStacking: false,
				unitPrice: 100,
			})

			expect(result.stackableDiscounts.length).toBe(0)
			expect(
				result.appliedMerchantCoupon?.type === 'ppp' ||
					result.appliedMerchantCoupon?.type === 'special',
			).toBe(true)
			// If PPP is applied, it should have 75% discount
			if (result.appliedMerchantCoupon?.type === 'ppp') {
				expect(result.appliedMerchantCoupon?.percentageDiscount).toBe(0.75)
			}
		})

		it('❌ MUST PREVENT: PPP + Default + Credit CANNOT stack together (NEVER ALLOWED)', async () => {
			const entitlementType =
				await createMockAdapter().getEntitlementTypeByName(
					'apply_special_credit',
				)
			const entitlementTypeId = entitlementType?.id || 'et_test_123'

			const mockAdapter = createMockAdapter({
				getPurchasesForUser: vi.fn(async () => []),
				getEntitlementsForUser: vi.fn(async () => [
					{
						id: 'entitlement_1',
						entitlementType: entitlementTypeId,
						userId: 'user_1',
						sourceType: 'COUPON',
						sourceId: 'coupon_credit_150',
						metadata: {},
					},
				]),
				getCoupon: vi.fn(async (id: string) => {
					if (id === 'coupon_default_40') {
						return {
							id: 'coupon_default_40',
							code: 'DEFAULT40',
							merchantCouponId: 'merchant_coupon_default_40',
							status: 0,
							fields: {},
							maxUses: -1,
							default: true,
							usedCount: 0,
							createdAt: new Date(),
							percentageDiscount: 0,
							expires: null,
							bulkPurchases: [],
							redeemedBulkCouponPurchases: [],
						} as Coupon
					}
					return {
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
					} as Coupon
				}),
				getMerchantCoupon: vi.fn(async (id: string) => {
					if (id === 'merchant_coupon_default_40') {
						return {
							id: 'merchant_coupon_default_40',
							identifier: 'stripe_coupon_default_40',
							percentageDiscount: 0.4,
							type: 'special',
							status: 1,
							merchantAccountId: 'merchant_1',
						} as MerchantCoupon
					}
					return {
						id: 'merchant_coupon_credit_150',
						identifier: 'stripe_coupon_credit_150',
						amountDiscount: 15000,
						type: 'special credit',
						status: 1,
						merchantAccountId: 'merchant_1',
					} as MerchantCoupon
				}),
				getMerchantCouponsForTypeAndPercent: vi.fn(async () => [
					{
						id: 'merchant_coupon_ppp',
						identifier: 'stripe_coupon_ppp',
						percentageDiscount: 0.75,
						type: 'ppp',
						status: 1,
						merchantAccountId: 'merchant_1',
					},
				]),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				merchantCouponId: 'merchant_coupon_default_40',
				usedCouponId: 'coupon_default_40',
				country: 'IN',
				quantity: 1,
				userId: 'user_1',
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				preferStacking: false,
				unitPrice: 100,
			})

			expect(result.stackingPath).toBe('stack')
			expect(result.stackableDiscounts.length).toBeGreaterThanOrEqual(1)

			const creditDiscount = result.stackableDiscounts.find(
				(d) => d.source === 'entitlement',
			)
			expect(creditDiscount).toBeDefined()

			const defaultDiscount = result.stackableDiscounts.find(
				(d) => d.source === 'default',
			)
			const pppDiscount = result.stackableDiscounts.find(
				(d) => d.source === 'ppp',
			)

			// CRITICAL RULE: PPP and Default should NEVER both be in stackableDiscounts
			if (defaultDiscount && pppDiscount) {
				throw new Error(
					'CRITICAL RULE VIOLATION: PPP and Default are both in stackableDiscounts - this should NEVER happen!',
				)
			}

			// When PPP is involved (either in stackableDiscounts or as applied coupon),
			// Default should NOT be in stackableDiscounts
			const hasPPP = pppDiscount || result.appliedMerchantCoupon?.type === 'ppp'
			if (hasPPP) {
				expect(defaultDiscount).toBeUndefined()
			}
		})
	})
})
