import { describe, expect, it, vi } from 'vitest'

import { determineCouponToApply } from '../src/lib/pricing/determine-coupon-to-apply'
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
					testMerchantCoupons.ppp60,
				]),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				merchantCouponId: 'coupon_fixed_20',
				country: 'IN', // India has 60% PPP discount
				quantity: 1,
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				unitPrice: 100,
			})

			// PPP 60% on $100 = $40 final
			// Fixed $20 on $100 = $80 final
			// PPP is better, so should be preferred
			expect(result.appliedDiscountType).toBe('ppp')
			expect(result.appliedMerchantCoupon?.percentageDiscount).toBe(0.6)
		})

		it('should not apply fixed coupon for bulk purchases', async () => {
			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(async () => testMerchantCoupons.fixedAmount20),
				getPurchasesForUser: vi.fn(async () => []),
				getMerchantCouponsForTypeAndPercent: vi.fn(async () => [
					testMerchantCoupons.bulk20,
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
				unitPrice: 100,
			})

			// Should fall back to bulk discount
			expect(result.bulk).toBe(true)
			expect(result.appliedDiscountType).toBe('bulk')
		})
	})

	describe('PPP Logic (Existing Functionality)', () => {
		it('should apply PPP discount when conditions are met', async () => {
			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(async () => null),
				getPurchasesForUser: vi.fn(async () => []),
				getMerchantCouponsForTypeAndPercent: vi.fn(async () => [
					testMerchantCoupons.ppp60,
				]),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				country: 'IN', // India
				quantity: 1,
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
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
				unitPrice: 100,
			})

			expect(result.appliedDiscountType).toBe('none')
		})

		it('should not apply PPP for bulk purchases', async () => {
			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(async () => null),
				getPurchasesForUser: vi.fn(async () => []),
				getMerchantCouponsForTypeAndPercent: vi.fn(async () => [
					testMerchantCoupons.bulk20,
				]),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				country: 'IN',
				quantity: 5, // Bulk
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
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
					testMerchantCoupons.bulk20,
				]),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				country: 'US',
				quantity: 5,
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				unitPrice: 100,
			})

			expect(result.bulk).toBe(true)
			expect(result.appliedDiscountType).toBe('bulk')
			expect(result.appliedMerchantCoupon?.percentageDiscount).toBe(0.2)
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
				unitPrice: 100,
			})

			// Merchant 25% is better than bulk 20%, so should use merchant
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
					testMerchantCoupons.ppp60,
				]),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				country: 'IN',
				quantity: 1,
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
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
				unitPrice: 100,
			})

			expect(result).toBeDefined()
			expect(result.appliedDiscountType).toBe('fixed')
		})
	})
})
