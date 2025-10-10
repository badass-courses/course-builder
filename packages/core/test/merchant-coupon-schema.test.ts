import { describe, expect, it } from 'vitest'

import { merchantCouponSchema } from '../src/schemas/merchant-coupon-schema'

describe('MerchantCoupon Schema Validation', () => {
	describe('Fixed Amount Discounts', () => {
		it('should accept coupon with amountDiscount only', () => {
			const coupon = {
				id: 'test_fixed_1',
				merchantAccountId: 'merchant_1',
				amountDiscount: 2000,
				type: 'special',
				status: 1,
			}

			const result = merchantCouponSchema.safeParse(coupon)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.amountDiscount).toBe(2000)
			}
		})

		it('should require amountDiscount to be an integer (cents)', () => {
			const coupon = {
				id: 'test_fixed_decimal',
				merchantAccountId: 'merchant_1',
				amountDiscount: 20.5, // Invalid - must be integer
				type: 'special',
				status: 1,
			}

			const result = merchantCouponSchema.safeParse(coupon)
			expect(result.success).toBe(false)
		})

		it('should accept zero amountDiscount', () => {
			const coupon = {
				id: 'test_zero_amount',
				merchantAccountId: 'merchant_1',
				amountDiscount: 0,
				type: 'special',
				status: 1,
			}

			const result = merchantCouponSchema.safeParse(coupon)
			expect(result.success).toBe(true)
		})

		it('should reject negative amountDiscount', () => {
			const coupon = {
				id: 'test_negative',
				merchantAccountId: 'merchant_1',
				amountDiscount: -1000,
				type: 'special',
				status: 1,
			}

			const result = merchantCouponSchema.safeParse(coupon)
			expect(result.success).toBe(false)
		})
	})

	describe('Percentage Discounts (Existing Functionality)', () => {
		it('should accept coupon with percentageDiscount only', () => {
			const coupon = {
				id: 'test_percent_1',
				merchantAccountId: 'merchant_1',
				percentageDiscount: 0.25,
				type: 'special',
				status: 1,
			}

			const result = merchantCouponSchema.safeParse(coupon)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.percentageDiscount).toBe(0.25)
			}
		})

		it('should limit percentageDiscount decimal places to 2', () => {
			const coupon = {
				id: 'test_percent_decimal',
				merchantAccountId: 'merchant_1',
				percentageDiscount: 0.2543, // More than 2 decimal places
				type: 'special',
				status: 1,
			}

			const result = merchantCouponSchema.safeParse(coupon)
			// Should fail validation due to >2 decimal places
			expect(result.success).toBe(false)
		})

		it('should accept percentageDiscount with up to 2 decimal places', () => {
			const coupon = {
				id: 'test_percent_valid_decimal',
				merchantAccountId: 'merchant_1',
				percentageDiscount: 0.25,
				type: 'special',
				status: 1,
			}

			const result = merchantCouponSchema.safeParse(coupon)
			expect(result.success).toBe(true)
		})
	})

	describe('Mutual Exclusivity Validation', () => {
		it('should reject coupon with both percentageDiscount and amountDiscount', () => {
			const coupon = {
				id: 'test_both',
				merchantAccountId: 'merchant_1',
				percentageDiscount: 0.25,
				amountDiscount: 2000,
				type: 'special',
				status: 1,
			}

			const result = merchantCouponSchema.safeParse(coupon)
			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.error.message).toContain(
					'both percentageDiscount and amountDiscount',
				)
			}
		})

		it('should accept coupon with neither discount type (inactive coupon)', () => {
			const coupon = {
				id: 'test_no_discount',
				merchantAccountId: 'merchant_1',
				type: 'special',
				status: 0,
			}

			const result = merchantCouponSchema.safeParse(coupon)
			expect(result.success).toBe(true)
		})

		it('should accept coupon with only percentageDiscount > 0', () => {
			const coupon = {
				id: 'test_only_percent',
				merchantAccountId: 'merchant_1',
				percentageDiscount: 0.3,
				amountDiscount: 0, // Explicitly 0
				type: 'special',
				status: 1,
			}

			const result = merchantCouponSchema.safeParse(coupon)
			expect(result.success).toBe(true)
		})

		it('should accept coupon with only amountDiscount > 0', () => {
			const coupon = {
				id: 'test_only_amount',
				merchantAccountId: 'merchant_1',
				percentageDiscount: 0, // Explicitly 0
				amountDiscount: 3000,
				type: 'special',
				status: 1,
			}

			const result = merchantCouponSchema.safeParse(coupon)
			expect(result.success).toBe(true)
		})
	})

	describe('Optional Fields', () => {
		it('should make amountDiscount optional', () => {
			const coupon = {
				id: 'test_no_amount',
				merchantAccountId: 'merchant_1',
				percentageDiscount: 0.25,
				type: 'special',
				status: 1,
			}

			const result = merchantCouponSchema.safeParse(coupon)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.amountDiscount).toBeUndefined()
			}
		})

		it('should make percentageDiscount optional', () => {
			const coupon = {
				id: 'test_no_percent',
				merchantAccountId: 'merchant_1',
				amountDiscount: 2000,
				type: 'special',
				status: 1,
			}

			const result = merchantCouponSchema.safeParse(coupon)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.percentageDiscount).toBeUndefined()
			}
		})

		it('should allow identifier to be null', () => {
			const coupon = {
				id: 'test_null_identifier',
				identifier: null,
				merchantAccountId: 'merchant_1',
				amountDiscount: 2000,
				type: 'special',
				status: 1,
			}

			const result = merchantCouponSchema.safeParse(coupon)
			expect(result.success).toBe(true)
		})

		it('should allow identifier to be undefined', () => {
			const coupon = {
				id: 'test_undefined_identifier',
				merchantAccountId: 'merchant_1',
				amountDiscount: 2000,
				type: 'special',
				status: 1,
			}

			const result = merchantCouponSchema.safeParse(coupon)
			expect(result.success).toBe(true)
		})
	})

	describe('Required Fields', () => {
		it('should require id', () => {
			const coupon = {
				merchantAccountId: 'merchant_1',
				amountDiscount: 2000,
				type: 'special',
				status: 1,
			}

			const result = merchantCouponSchema.safeParse(coupon)
			expect(result.success).toBe(false)
		})

		it('should require merchantAccountId', () => {
			const coupon = {
				id: 'test_no_merchant',
				amountDiscount: 2000,
				type: 'special',
				status: 1,
			}

			const result = merchantCouponSchema.safeParse(coupon)
			expect(result.success).toBe(false)
		})

		it('should require type', () => {
			const coupon = {
				id: 'test_no_type',
				merchantAccountId: 'merchant_1',
				amountDiscount: 2000,
				status: 1,
			}

			const result = merchantCouponSchema.safeParse(coupon)
			expect(result.success).toBe(false)
		})

		it('should default status to 0', () => {
			const coupon = {
				id: 'test_default_status',
				merchantAccountId: 'merchant_1',
				amountDiscount: 2000,
				type: 'special',
			}

			const result = merchantCouponSchema.safeParse(coupon)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.status).toBe(0)
			}
		})
	})

	describe('String Length Limits', () => {
		it('should limit id to 191 characters', () => {
			const coupon = {
				id: 'x'.repeat(192),
				merchantAccountId: 'merchant_1',
				amountDiscount: 2000,
				type: 'special',
				status: 1,
			}

			const result = merchantCouponSchema.safeParse(coupon)
			expect(result.success).toBe(false)
		})

		it('should limit identifier to 191 characters', () => {
			const coupon = {
				id: 'test_long_identifier',
				identifier: 'x'.repeat(192),
				merchantAccountId: 'merchant_1',
				amountDiscount: 2000,
				type: 'special',
				status: 1,
			}

			const result = merchantCouponSchema.safeParse(coupon)
			expect(result.success).toBe(false)
		})

		it('should limit merchantAccountId to 191 characters', () => {
			const coupon = {
				id: 'test_long_merchant',
				merchantAccountId: 'x'.repeat(192),
				amountDiscount: 2000,
				type: 'special',
				status: 1,
			}

			const result = merchantCouponSchema.safeParse(coupon)
			expect(result.success).toBe(false)
		})

		it('should limit type to 191 characters', () => {
			const coupon = {
				id: 'test_long_type',
				merchantAccountId: 'merchant_1',
				amountDiscount: 2000,
				type: 'x'.repeat(192),
				status: 1,
			}

			const result = merchantCouponSchema.safeParse(coupon)
			expect(result.success).toBe(false)
		})
	})
})
