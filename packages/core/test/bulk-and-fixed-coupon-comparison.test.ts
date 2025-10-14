import { describe, expect, it, vi } from 'vitest'

import { determineCouponToApply } from '../src/lib/pricing/determine-coupon-to-apply'
import { createMockAdapter, testMerchantCoupons } from './pricing-test-fixtures'

/**
 * Comprehensive tests for bulk purchase scenarios with fixed amount coupons
 *
 * These tests cover the critical edge case where:
 * - There's a default bulk discount (percentage-based)
 * - User applies a fixed amount coupon
 * - Different product price points yield different best discounts
 *
 * Example: 40% bulk discount vs $30 fixed coupon
 * - On $1000 product: 40% = $400 off vs $30 off → Bulk wins
 * - On $100 product: 40% = $40 off vs $30 off → Bulk wins (but closer)
 * - On $50 product: 40% = $20 off vs $30 off → Fixed wins
 */
describe('Bulk Purchase + Default Coupon vs Fixed Coupon Comparison', () => {
	describe('Expensive Product ($1000) with Bulk Discount', () => {
		it('should prefer bulk 40% over $30 fixed for bulk purchase of expensive product', async () => {
			// Product: $1000, Quantity: 5
			// Bulk 40%: $2000 off → $3000 final
			// Fixed $30: $30 off → $4970 final
			// Bulk is clearly better
			const fixedCoupon30 = {
				...testMerchantCoupons.fixedAmount20,
				id: 'coupon_fixed_30',
				amountDiscount: 3000, // $30
			}

			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(async () => fixedCoupon30),
				getPurchasesForUser: vi.fn(async () => []),
				getMerchantCouponsForTypeAndPercent: vi.fn(async () => [
					{
						...testMerchantCoupons.bulk20,
						percentageDiscount: 0.4, // 40% bulk discount
					},
				]),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				merchantCouponId: 'coupon_fixed_30',
				country: 'US',
				quantity: 5,
				productId: 'prod_expensive',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				unitPrice: 1000,
			})

			expect(result.appliedDiscountType).toBe('bulk')
			expect(result.bulk).toBe(true)
			expect(result.appliedMerchantCoupon?.percentageDiscount).toBe(0.4)
		})

		it('should prefer bulk 40% over $100 fixed for bulk purchase of expensive product', async () => {
			// Product: $1000, Quantity: 5
			// Bulk 40%: $2000 off → $3000 final
			// Fixed $100: $100 off → $4900 final
			// Bulk is still better

			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(
					async () => testMerchantCoupons.fixedAmount100,
				),
				getPurchasesForUser: vi.fn(async () => []),
				getMerchantCouponsForTypeAndPercent: vi.fn(async () => [
					{
						...testMerchantCoupons.bulk20,
						percentageDiscount: 0.4,
					},
				]),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				merchantCouponId: 'coupon_fixed_100',
				country: 'US',
				quantity: 5,
				productId: 'prod_expensive',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				unitPrice: 1000,
			})

			expect(result.appliedDiscountType).toBe('bulk')
			expect(result.bulk).toBe(true)
		})

		it('should prefer fixed $500/seat over bulk 40% for bulk purchase', async () => {
			// Product: $1000, Quantity: 5 → Subtotal: $5000
			// Bulk 40%: $2000 off → $3000 final
			// Fixed $500/seat × 5: $2500 off → $2500 final
			// Fixed per-seat wins!

			const fixedCoupon500 = {
				...testMerchantCoupons.fixedAmount20,
				id: 'coupon_fixed_500',
				amountDiscount: 50000, // $500
			}

			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(async () => fixedCoupon500),
				getPurchasesForUser: vi.fn(async () => []),
				getMerchantCouponsForTypeAndPercent: vi.fn(async () => [
					{
						...testMerchantCoupons.bulk20,
						percentageDiscount: 0.4,
					},
				]),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				merchantCouponId: 'coupon_fixed_500',
				country: 'US',
				quantity: 5,
				productId: 'prod_expensive',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				unitPrice: 1000,
			})

			// Fixed $500/seat × 5 ($2500) > Bulk 40% ($2000), so fixed wins
			expect(result.appliedDiscountType).toBe('fixed')
			expect(result.bulk).toBe(true)
		})
	})

	describe('Mid-Range Product ($100) with Bulk Discount', () => {
		it('should prefer fixed $30/seat over actual bulk 15% for quantity 5', async () => {
			// Product: $100, Quantity: 5 → Subtotal: $500
			// Bulk 15% (actual for qty 5): $75 off → $425 final
			// Fixed $30/seat × 5: $150 off → $350 final
			// Fixed per-seat wins! ($150 > $75)
			// Note: getBulkDiscountPercent(5) = 0.15, not the mocked 0.4
			const fixedCoupon30 = {
				...testMerchantCoupons.fixedAmount20,
				id: 'coupon_fixed_30',
				amountDiscount: 3000, // $30
			}

			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(async () => fixedCoupon30),
				getPurchasesForUser: vi.fn(async () => []),
				getMerchantCouponsForTypeAndPercent: vi.fn(async () => [
					{
						...testMerchantCoupons.bulk20,
						percentageDiscount: 0.4, // Mock ignored - actual is 15%
					},
				]),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				merchantCouponId: 'coupon_fixed_30',
				country: 'US',
				quantity: 5,
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				unitPrice: 100,
			})

			expect(result.appliedDiscountType).toBe('fixed')
			expect(result.bulk).toBe(true)
		})

		it('should prefer bulk 20% over $10 fixed for smaller bulk discount', async () => {
			// Product: $100, Quantity: 5 → Subtotal: $500
			// Bulk 20%: $100 off → $400 final
			// Fixed $10: $10 off → $490 final
			// Bulk is better
			const fixedCoupon10 = {
				...testMerchantCoupons.fixedAmount20,
				id: 'coupon_fixed_10',
				amountDiscount: 1000, // $10
			}

			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(async () => fixedCoupon10),
				getPurchasesForUser: vi.fn(async () => []),
				getMerchantCouponsForTypeAndPercent: vi.fn(async () => [
					testMerchantCoupons.bulk20, // 20% bulk
				]),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				merchantCouponId: 'coupon_fixed_10',
				country: 'US',
				quantity: 5,
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				unitPrice: 100,
			})

			expect(result.appliedDiscountType).toBe('bulk')
			expect(result.appliedMerchantCoupon?.percentageDiscount).toBe(0.2)
		})
	})

	describe('Cheap Product ($50) with Bulk Discount', () => {
		it('should prefer fixed $30/seat over bulk 40% for bulk purchase', async () => {
			// Product: $50, Quantity: 5 → Subtotal: $250
			// Bulk 40%: $100 off → $150 final
			// Fixed $30/seat × 5: $150 off → $100 final
			// Fixed per-seat wins!
			const fixedCoupon30 = {
				...testMerchantCoupons.fixedAmount20,
				id: 'coupon_fixed_30',
				amountDiscount: 3000, // $30
			}

			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(async () => fixedCoupon30),
				getPurchasesForUser: vi.fn(async () => []),
				getMerchantCouponsForTypeAndPercent: vi.fn(async () => [
					{
						...testMerchantCoupons.bulk20,
						percentageDiscount: 0.4,
					},
				]),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				merchantCouponId: 'coupon_fixed_30',
				country: 'US',
				quantity: 5,
				productId: 'prod_cheap',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				unitPrice: 50,
			})

			// Fixed $30/seat × 5 ($150) > Bulk 40% ($100), so fixed wins
			expect(result.appliedDiscountType).toBe('fixed')
			expect(result.bulk).toBe(true)
		})

		it('should prefer $75 fixed over bulk 15% when fixed provides more savings', async () => {
			// Product: $50, Quantity: 5 → Subtotal: $250
			// Bulk 15% (quantity 5-9): $37.50 off → $212.50 final
			// Fixed $75: $75 off → $175 final
			// Fixed is better!

			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(async () => testMerchantCoupons.fixedAmount75),
				getPurchasesForUser: vi.fn(async () => []),
				getMerchantCouponsForTypeAndPercent: vi.fn(async () => [
					{
						...testMerchantCoupons.bulk20,
						percentageDiscount: 0.15, // 15% for quantity 5-9
					},
				]),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				merchantCouponId: 'coupon_fixed_75',
				country: 'US',
				quantity: 5,
				productId: 'prod_cheap',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				unitPrice: 50,
			})

			// Fixed $75 > bulk 15% ($37.50), so fixed wins
			expect(result.appliedDiscountType).toBe('fixed')
			expect(result.bulk).toBe(true)
		})
	})

	describe('Different Bulk Quantities', () => {
		it('should apply fixed coupon when quantity 2 has no bulk discount', async () => {
			// Product: $100, Quantity: 2 → Subtotal: $200
			// Bulk discount: 0% (quantity ≤ 4)
			// Fixed $30: $30 off → $170 final
			// Fixed applies because no bulk discount available
			const fixedCoupon30 = {
				...testMerchantCoupons.fixedAmount20,
				id: 'coupon_fixed_30',
				amountDiscount: 3000,
			}

			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(async () => fixedCoupon30),
				getPurchasesForUser: vi.fn(async () => []),
				getMerchantCouponsForTypeAndPercent: vi.fn(async () => []),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				merchantCouponId: 'coupon_fixed_30',
				country: 'US',
				quantity: 2,
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				unitPrice: 100,
			})

			// Quantity 2 has no bulk discount, so fixed applies
			expect(result.bulk).toBe(true) // Still considered bulk purchase
			expect(result.appliedDiscountType).toBe('fixed')
		})

		it('should handle quantity 10 with fixed coupon', async () => {
			// Product: $100, Quantity: 10 → Subtotal: $1000
			// Bulk 20%: $200 off → $800 final
			// Fixed $30/seat × 10: $300 off → $700 final
			// Fixed per-seat wins
			const fixedCoupon30 = {
				...testMerchantCoupons.fixedAmount20,
				id: 'coupon_fixed_30',
				amountDiscount: 3000,
			}

			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(async () => fixedCoupon30),
				getPurchasesForUser: vi.fn(async () => []),
				getMerchantCouponsForTypeAndPercent: vi.fn(async () => [
					testMerchantCoupons.bulk20,
				]),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				merchantCouponId: 'coupon_fixed_30',
				country: 'US',
				quantity: 10,
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				unitPrice: 100,
			})

			expect(result.bulk).toBe(true)
			// Fixed $30/seat × 10 ($300) > Bulk 20% ($200), so fixed wins
			expect(result.appliedDiscountType).toBe('fixed')
		})

		it('should handle extreme bulk quantity (100 units)', async () => {
			// Product: $100, Quantity: 100 → Subtotal: $10,000
			// Bulk 20%: $2000 off → $8000 final
			// Fixed $200/seat × 100: $20,000 off → FREE!
			// Fixed per-seat wins massively

			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(
					async () => testMerchantCoupons.fixedAmount200,
				),
				getPurchasesForUser: vi.fn(async () => []),
				getMerchantCouponsForTypeAndPercent: vi.fn(async () => [
					testMerchantCoupons.bulk20,
				]),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				merchantCouponId: 'coupon_fixed_200',
				country: 'US',
				quantity: 100,
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				unitPrice: 100,
			})

			expect(result.bulk).toBe(true)
			// Fixed $200/seat × 100 ($20,000) > Bulk 20% ($2,000), so fixed wins
			expect(result.appliedDiscountType).toBe('fixed')
		})
	})

	describe('Edge Cases', () => {
		it('should handle fixed discount that would result in negative price (clamped to 0)', async () => {
			// Product: $50, Quantity: 5 → Subtotal: $250
			// Bulk 15% (quantity 5-9): $37.50 off → $212.50 final
			// Fixed $300: $300 off → clamped to $0 (free!)
			// Fixed is better ($300 > $37.50)
			const fixedCoupon300 = {
				...testMerchantCoupons.fixedAmount20,
				id: 'coupon_fixed_300',
				amountDiscount: 30000, // $300
			}

			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(async () => fixedCoupon300),
				getPurchasesForUser: vi.fn(async () => []),
				getMerchantCouponsForTypeAndPercent: vi.fn(async () => [
					{
						...testMerchantCoupons.bulk20,
						percentageDiscount: 0.15, // 15% for quantity 5-9
					},
				]),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				merchantCouponId: 'coupon_fixed_300',
				country: 'US',
				quantity: 5,
				productId: 'prod_cheap',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				unitPrice: 50,
			})

			// Fixed $300 > bulk 15% ($37.50), so fixed applies
			expect(result.appliedDiscountType).toBe('fixed')
			expect(result.bulk).toBe(true)
		})

		it('should handle very small fixed discount ($1 off)', async () => {
			// Product: $100, Quantity: 5 → Subtotal: $500
			// Bulk 20%: $100 off → $400 final
			// Fixed $1: $1 off → $499 final
			// Bulk is much better
			const fixedCoupon1 = {
				...testMerchantCoupons.fixedAmount20,
				id: 'coupon_fixed_1',
				amountDiscount: 100, // $1
			}

			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(async () => fixedCoupon1),
				getPurchasesForUser: vi.fn(async () => []),
				getMerchantCouponsForTypeAndPercent: vi.fn(async () => [
					testMerchantCoupons.bulk20,
				]),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				merchantCouponId: 'coupon_fixed_1',
				country: 'US',
				quantity: 5,
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				unitPrice: 100,
			})

			expect(result.appliedDiscountType).toBe('bulk')
			expect(result.bulk).toBe(true)
		})
	})

	describe('PPP + Bulk + Fixed Interactions', () => {
		it('should not apply PPP for bulk purchases even with fixed coupon', async () => {
			// User in India (60% PPP), buying in bulk with fixed coupon
			// PPP should not apply for quantity > 1
			const fixedCoupon30 = {
				...testMerchantCoupons.fixedAmount20,
				id: 'coupon_fixed_30',
				amountDiscount: 3000,
			}

			const mockAdapter = createMockAdapter({
				getMerchantCoupon: vi.fn(async () => fixedCoupon30),
				getPurchasesForUser: vi.fn(async () => []),
				getMerchantCouponsForTypeAndPercent: vi.fn(async (options) => {
					if (options.type === 'ppp') return [testMerchantCoupons.ppp60]
					if (options.type === 'bulk') return [testMerchantCoupons.bulk20]
					return []
				}),
			})

			const result = await determineCouponToApply({
				prismaCtx: mockAdapter,
				merchantCouponId: 'coupon_fixed_30',
				country: 'IN', // India
				quantity: 5,
				productId: 'prod_basic',
				purchaseToBeUpgraded: null,
				autoApplyPPP: true,
				unitPrice: 100,
			})

			expect(result.appliedDiscountType).not.toBe('ppp')
			expect(result.bulk).toBe(true)
			// Fixed $30/seat × 5 ($150) > Bulk 20% ($100), so fixed wins
			expect(result.appliedDiscountType).toBe('fixed')
		})
	})
})
