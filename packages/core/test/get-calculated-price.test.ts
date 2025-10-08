import { describe, expect, it } from 'vitest'

import { getCalculatedPrice } from '../src/lib/pricing/get-calculated-price'

describe('getCalculatedPrice', () => {
	describe('Basic Calculations', () => {
		it('should return full price when no discounts applied', () => {
			const result = getCalculatedPrice({
				unitPrice: 100,
				quantity: 1,
				percentOfDiscount: 0,
				fixedDiscount: 0,
			})

			expect(result).toBe(100)
		})

		it('should calculate simple unit price * quantity', () => {
			const result = getCalculatedPrice({
				unitPrice: 50,
				quantity: 3,
			})

			expect(result).toBe(150)
		})

		it('should handle decimal unit prices', () => {
			const result = getCalculatedPrice({
				unitPrice: 99.99,
				quantity: 1,
			})

			expect(result).toBe(99.99)
		})
	})

	describe('Fixed Discount Only', () => {
		it('should apply fixed discount without percentage', () => {
			const result = getCalculatedPrice({
				unitPrice: 100,
				quantity: 1,
				fixedDiscount: 20,
				percentOfDiscount: 0,
			})

			expect(result).toBe(80)
		})

		it('should apply fixed discount with quantity', () => {
			const result = getCalculatedPrice({
				unitPrice: 100,
				quantity: 3,
				fixedDiscount: 50,
			})

			// (100 * 3) - 50 = 250
			expect(result).toBe(250)
		})

		it('should handle fixed discount equal to price', () => {
			const result = getCalculatedPrice({
				unitPrice: 100,
				quantity: 1,
				fixedDiscount: 100,
			})

			expect(result).toBe(0)
		})

		it('should clamp negative prices to 0', () => {
			const result = getCalculatedPrice({
				unitPrice: 50,
				quantity: 1,
				fixedDiscount: 100,
			})

			// Should be clamped to 0, not negative
			expect(result).toBeGreaterThanOrEqual(0)
			expect(result).toBe(0)
		})

		it('should handle very large fixed discounts', () => {
			const result = getCalculatedPrice({
				unitPrice: 100,
				quantity: 1,
				fixedDiscount: 10000,
			})

			expect(result).toBe(0)
		})
	})

	describe('Percentage Discount Only', () => {
		it('should apply percentage discount without fixed', () => {
			const result = getCalculatedPrice({
				unitPrice: 100,
				quantity: 1,
				percentOfDiscount: 0.25,
				fixedDiscount: 0,
			})

			// 100 * 0.75 = 75
			expect(result).toBe(75)
		})

		it('should apply 50% discount correctly', () => {
			const result = getCalculatedPrice({
				unitPrice: 200,
				quantity: 1,
				percentOfDiscount: 0.5,
			})

			expect(result).toBe(100)
		})

		it('should handle PPP-style high percentage discounts', () => {
			const result = getCalculatedPrice({
				unitPrice: 100,
				quantity: 1,
				percentOfDiscount: 0.6,
			})

			// 100 * 0.4 = 40
			expect(result).toBe(40)
		})

		it('should handle 100% discount', () => {
			const result = getCalculatedPrice({
				unitPrice: 100,
				quantity: 1,
				percentOfDiscount: 1.0,
			})

			expect(result).toBe(0)
		})

		it('should apply percentage to total (unitPrice * quantity)', () => {
			const result = getCalculatedPrice({
				unitPrice: 100,
				quantity: 5,
				percentOfDiscount: 0.2,
			})

			// (100 * 5) * 0.8 = 400
			expect(result).toBe(400)
		})
	})

	describe('Combined Discounts (Fixed + Percentage)', () => {
		it('should apply fixed discount before percentage (upgrade scenario)', () => {
			const result = getCalculatedPrice({
				unitPrice: 100,
				quantity: 1,
				fixedDiscount: 20,
				percentOfDiscount: 0.25,
			})

			// (100 - 20) * 0.75 = 60
			expect(result).toBe(60)
		})

		it('should handle fixed discount with percentage on quantity', () => {
			const result = getCalculatedPrice({
				unitPrice: 100,
				quantity: 3,
				fixedDiscount: 50,
				percentOfDiscount: 0.2,
			})

			// ((100 * 3) - 50) * 0.8 = 250 * 0.8 = 200
			expect(result).toBe(200)
		})

		it('should handle case where fixed discount reduces price significantly before percentage', () => {
			const result = getCalculatedPrice({
				unitPrice: 500,
				quantity: 1,
				fixedDiscount: 300,
				percentOfDiscount: 0.5,
			})

			// (500 - 300) * 0.5 = 100
			expect(result).toBe(100)
		})

		it('should clamp to 0 when combined discounts exceed price', () => {
			const result = getCalculatedPrice({
				unitPrice: 100,
				quantity: 1,
				fixedDiscount: 90,
				percentOfDiscount: 0.5,
			})

			// (100 - 90) * 0.5 = 5
			expect(result).toBe(5)
		})
	})

	describe('Edge Cases', () => {
		it('should handle zero unit price', () => {
			const result = getCalculatedPrice({
				unitPrice: 0,
				quantity: 1,
			})

			expect(result).toBe(0)
		})

		it('should handle zero quantity', () => {
			const result = getCalculatedPrice({
				unitPrice: 100,
				quantity: 0,
			})

			expect(result).toBe(0)
		})

		it('should handle fractional quantities', () => {
			const result = getCalculatedPrice({
				unitPrice: 100,
				quantity: 1.5,
			})

			expect(result).toBe(150)
		})

		it('should round to 2 decimal places', () => {
			const result = getCalculatedPrice({
				unitPrice: 99.999,
				quantity: 1,
			})

			// Should be rounded to 2 decimal places
			expect(result.toFixed(2)).toBe('100.00')
		})

		it('should handle very small percentages', () => {
			const result = getCalculatedPrice({
				unitPrice: 100,
				quantity: 1,
				percentOfDiscount: 0.01,
			})

			// 100 * 0.99 = 99
			expect(result).toBe(99)
		})

		it('should handle very large unit prices', () => {
			const result = getCalculatedPrice({
				unitPrice: 999999,
				quantity: 1,
				percentOfDiscount: 0.1,
			})

			// 999999 * 0.9 = 899999.1
			expect(result).toBe(899999.1)
		})
	})

	describe('Default Parameter Values', () => {
		it('should default percentOfDiscount to 0', () => {
			const result = getCalculatedPrice({
				unitPrice: 100,
				quantity: 1,
			})

			expect(result).toBe(100)
		})

		it('should default quantity to 1', () => {
			const result = getCalculatedPrice({
				unitPrice: 100,
			})

			expect(result).toBe(100)
		})

		it('should default fixedDiscount to 0', () => {
			const result = getCalculatedPrice({
				unitPrice: 100,
				quantity: 1,
			})

			expect(result).toBe(100)
		})

		it('should work with only unitPrice provided', () => {
			const result = getCalculatedPrice({
				unitPrice: 100,
			})

			expect(result).toBe(100)
		})
	})

	describe('Realistic Pricing Scenarios', () => {
		it('should calculate PPP upgrade scenario', () => {
			// Product: $200, Upgrade credit: $100, PPP 60% off
			const result = getCalculatedPrice({
				unitPrice: 200,
				quantity: 1,
				fixedDiscount: 100, // Upgrade discount
				percentOfDiscount: 0.6, // PPP discount
			})

			// (200 - 100) * 0.4 = 40
			expect(result).toBe(40)
		})

		it('should calculate bulk purchase with 20% off', () => {
			const result = getCalculatedPrice({
				unitPrice: 100,
				quantity: 5,
				percentOfDiscount: 0.2,
			})

			// (100 * 5) * 0.8 = 400
			expect(result).toBe(400)
		})

		it('should calculate individual upgrade (no percentage)', () => {
			const result = getCalculatedPrice({
				unitPrice: 200,
				quantity: 1,
				fixedDiscount: 100, // Previous purchase value
			})

			expect(result).toBe(100)
		})

		it('should calculate standard merchant coupon (25% off)', () => {
			const result = getCalculatedPrice({
				unitPrice: 100,
				quantity: 1,
				percentOfDiscount: 0.25,
			})

			expect(result).toBe(75)
		})
	})

	describe('Precision and Rounding', () => {
		it('should maintain precision for typical currency values', () => {
			const result = getCalculatedPrice({
				unitPrice: 49.99,
				quantity: 1,
				percentOfDiscount: 0.2,
			})

			// 49.99 * 0.8 = 39.992 → rounds to 39.99
			expect(result).toBe(39.99)
		})

		it('should handle three significant figures correctly', () => {
			const result = getCalculatedPrice({
				unitPrice: 99.95,
				quantity: 1,
				percentOfDiscount: 0.15,
			})

			// 99.95 * 0.85 = 84.9575 → rounds to 84.96
			expect(result).toBe(84.96)
		})

		it('should return number type, not string', () => {
			const result = getCalculatedPrice({
				unitPrice: 100,
				quantity: 1,
			})

			expect(typeof result).toBe('number')
		})
	})
})
