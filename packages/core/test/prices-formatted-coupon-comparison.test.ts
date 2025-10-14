import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CourseBuilderAdapter } from '../src/adapters'
import { getPricesFormatted } from '../src/lib/actions/prices-formatted'
import { Coupon, MerchantCoupon, Price, Product } from '../src/schemas'
import type { InternalOptions, RequestInternal } from '../src/types'

/**
 * Tests for coupon comparison logic in getPricesFormatted
 *
 * This test suite specifically covers the bug fix where fixed amount coupons
 * were not being properly compared against percentage-based default coupons.
 *
 * Bug: When a user applied a $100 fixed coupon via URL, but there was a global
 * 40% coupon, the system would choose the 40% coupon because it only compared
 * percentageDiscount values (100 fixed = null percentage = 0, vs 0.40).
 *
 * Fix: Now we calculate actual discount amounts in dollars and compare those.
 */

describe('getPricesFormatted - Coupon Comparison Logic', () => {
	let mockAdapter: CourseBuilderAdapter
	let mockOptions: InternalOptions

	// Test products
	const testProduct: Product = {
		id: 'prod_course',
		name: 'Test Course',
		status: 1,
		type: 'self-paced',
		createdAt: new Date(),
	} as Product

	const testPrice: Price = {
		id: 'price_1',
		productId: 'prod_course',
		unitAmount: 150, // $150
		status: 1,
		createdAt: new Date(),
	} as Price

	// Test coupons
	const fixedCoupon100: MerchantCoupon = {
		id: 'mc_fixed_100',
		identifier: 'stripe_fixed_100',
		amountDiscount: 10000, // $100 in cents
		percentageDiscount: null,
		type: 'special',
		status: 1,
		merchantAccountId: 'merchant_1',
	} as MerchantCoupon

	const percentCoupon40: MerchantCoupon = {
		id: 'mc_percent_40',
		identifier: 'stripe_percent_40',
		amountDiscount: null,
		percentageDiscount: 0.4, // 40%
		type: 'special',
		status: 1,
		merchantAccountId: 'merchant_1',
	} as MerchantCoupon

	const fixedCoupon50: MerchantCoupon = {
		id: 'mc_fixed_50',
		identifier: 'stripe_fixed_50',
		amountDiscount: 5000, // $50 in cents
		percentageDiscount: null,
		type: 'special',
		status: 1,
		merchantAccountId: 'merchant_1',
	} as MerchantCoupon

	const percentCoupon25: MerchantCoupon = {
		id: 'mc_percent_25',
		identifier: 'stripe_percent_25',
		amountDiscount: null,
		percentageDiscount: 0.25, // 25%
		type: 'special',
		status: 1,
		merchantAccountId: 'merchant_1',
	} as MerchantCoupon

	beforeEach(() => {
		mockAdapter = {
			getProduct: vi.fn(async () => testProduct),
			getPriceForProduct: vi.fn(async () => testPrice),
			getPurchasesForUser: vi.fn(async () => []),
			getMerchantCoupon: vi.fn(),
			getCoupon: vi.fn(),
			couponForIdOrCode: vi.fn(),
			getDefaultCoupon: vi.fn(),
			availableUpgradesForProduct: vi.fn(async () => []),
			getPurchase: vi.fn(),
			getUpgradableProducts: vi.fn(),
			getMerchantCouponForTypeAndPercent: vi.fn(),
			getMerchantCouponsForTypeAndPercent: vi.fn(),
		} as unknown as CourseBuilderAdapter

		mockOptions = {
			adapter: mockAdapter,
			getCurrentUser: vi.fn(async () => null),
		} as unknown as InternalOptions
	})

	describe('Fixed Amount vs Percentage Discount', () => {
		it('should choose $100 fixed over 40% when fixed is better ($150 product)', async () => {
			// $100 fixed = $100 off = $50 final price
			// 40% = $60 off = $90 final price
			// Fixed is better

			const incomingCoupon: Coupon = {
				id: 'coupon_incoming',
				merchantCouponId: fixedCoupon100.id,
				merchantCoupon: fixedCoupon100,
				maxUses: -1,
				usedCount: 0,
			} as Coupon

			const defaultCoupon: Coupon = {
				id: 'coupon_default',
				merchantCouponId: percentCoupon40.id,
				merchantCoupon: percentCoupon40,
				maxUses: -1,
				usedCount: 0,
			} as Coupon

			vi.mocked(mockAdapter.couponForIdOrCode).mockResolvedValue(incomingCoupon)
			vi.mocked(mockAdapter.getDefaultCoupon).mockResolvedValue({
				defaultCoupon,
				defaultMerchantCoupon: percentCoupon40,
			})
			vi.mocked(mockAdapter.getMerchantCoupon).mockResolvedValue(fixedCoupon100)
			vi.mocked(mockAdapter.getCoupon).mockResolvedValue(incomingCoupon)

			const request: RequestInternal = {
				body: {
					productId: 'prod_course',
					couponId: 'coupon_incoming',
					quantity: 1,
					autoApplyPPP: false,
				},
				headers: {},
			}

			const response = await getPricesFormatted(request, [], mockOptions)

			expect(response.body).toMatchObject({
				appliedMerchantCoupon: expect.objectContaining({
					id: 'mc_fixed_100',
					amountDiscount: 10000,
				}),
				appliedDiscountType: 'fixed',
				calculatedPrice: 50, // $150 - $100 = $50
			})
		})

		it('should choose 40% over $50 fixed when percentage is better ($150 product)', async () => {
			// $50 fixed = $50 off = $100 final price
			// 40% = $60 off = $90 final price
			// Percentage is better

			const incomingCoupon: Coupon = {
				id: 'coupon_incoming',
				merchantCouponId: fixedCoupon50.id,
				merchantCoupon: fixedCoupon50,
				maxUses: -1,
				usedCount: 0,
			} as Coupon

			const defaultCoupon: Coupon = {
				id: 'coupon_default',
				merchantCouponId: percentCoupon40.id,
				merchantCoupon: percentCoupon40,
				maxUses: -1,
				usedCount: 0,
			} as Coupon

			vi.mocked(mockAdapter.couponForIdOrCode).mockResolvedValue(incomingCoupon)
			vi.mocked(mockAdapter.getDefaultCoupon).mockResolvedValue({
				defaultCoupon,
				defaultMerchantCoupon: percentCoupon40,
			})
			vi.mocked(mockAdapter.getMerchantCoupon).mockResolvedValue(
				percentCoupon40,
			)
			vi.mocked(mockAdapter.getCoupon).mockResolvedValue(defaultCoupon)

			const request: RequestInternal = {
				body: {
					productId: 'prod_course',
					couponId: 'coupon_incoming',
					quantity: 1,
					autoApplyPPP: false,
				},
				headers: {},
			}

			const response = await getPricesFormatted(request, [], mockOptions)

			expect(response.body).toMatchObject({
				appliedMerchantCoupon: expect.objectContaining({
					id: 'mc_percent_40',
					percentageDiscount: 0.4,
				}),
				appliedDiscountType: 'percentage',
				calculatedPrice: 90, // $150 * 0.60 = $90
			})
		})
	})

	describe('Fixed Amount vs Fixed Amount', () => {
		it('should choose larger fixed amount ($100 vs $50)', async () => {
			const incomingCoupon: Coupon = {
				id: 'coupon_incoming',
				merchantCouponId: fixedCoupon100.id,
				merchantCoupon: fixedCoupon100,
				maxUses: -1,
				usedCount: 0,
			} as Coupon

			const defaultCoupon: Coupon = {
				id: 'coupon_default',
				merchantCouponId: fixedCoupon50.id,
				merchantCoupon: fixedCoupon50,
				maxUses: -1,
				usedCount: 0,
			} as Coupon

			vi.mocked(mockAdapter.couponForIdOrCode).mockResolvedValue(incomingCoupon)
			vi.mocked(mockAdapter.getDefaultCoupon).mockResolvedValue({
				defaultCoupon,
				defaultMerchantCoupon: fixedCoupon50,
			})
			vi.mocked(mockAdapter.getMerchantCoupon).mockResolvedValue(fixedCoupon100)
			vi.mocked(mockAdapter.getCoupon).mockResolvedValue(incomingCoupon)

			const request: RequestInternal = {
				body: {
					productId: 'prod_course',
					couponId: 'coupon_incoming',
					quantity: 1,
					autoApplyPPP: false,
				},
				headers: {},
			}

			const response = await getPricesFormatted(request, [], mockOptions)

			expect(response.body).toMatchObject({
				appliedMerchantCoupon: expect.objectContaining({
					id: 'mc_fixed_100',
					amountDiscount: 10000,
				}),
				calculatedPrice: 50, // $150 - $100
			})
		})

		it('should choose default when incoming fixed amount is smaller', async () => {
			const incomingCoupon: Coupon = {
				id: 'coupon_incoming',
				merchantCouponId: fixedCoupon50.id,
				merchantCoupon: fixedCoupon50,
				maxUses: -1,
				usedCount: 0,
			} as Coupon

			const defaultCoupon: Coupon = {
				id: 'coupon_default',
				merchantCouponId: fixedCoupon100.id,
				merchantCoupon: fixedCoupon100,
				maxUses: -1,
				usedCount: 0,
			} as Coupon

			vi.mocked(mockAdapter.couponForIdOrCode).mockResolvedValue(incomingCoupon)
			vi.mocked(mockAdapter.getDefaultCoupon).mockResolvedValue({
				defaultCoupon,
				defaultMerchantCoupon: fixedCoupon100,
			})
			vi.mocked(mockAdapter.getMerchantCoupon).mockResolvedValue(fixedCoupon100)
			vi.mocked(mockAdapter.getCoupon).mockResolvedValue(defaultCoupon)

			const request: RequestInternal = {
				body: {
					productId: 'prod_course',
					couponId: 'coupon_incoming',
					quantity: 1,
					autoApplyPPP: false,
				},
				headers: {},
			}

			const response = await getPricesFormatted(request, [], mockOptions)

			expect(response.body).toMatchObject({
				appliedMerchantCoupon: expect.objectContaining({
					id: 'mc_fixed_100',
					amountDiscount: 10000,
				}),
				calculatedPrice: 50, // $150 - $100
			})
		})
	})

	describe('Percentage vs Percentage (Existing Behavior)', () => {
		it('should choose higher percentage (40% vs 25%)', async () => {
			const incomingCoupon: Coupon = {
				id: 'coupon_incoming',
				merchantCouponId: percentCoupon40.id,
				merchantCoupon: percentCoupon40,
				maxUses: -1,
				usedCount: 0,
			} as Coupon

			const defaultCoupon: Coupon = {
				id: 'coupon_default',
				merchantCouponId: percentCoupon25.id,
				merchantCoupon: percentCoupon25,
				maxUses: -1,
				usedCount: 0,
			} as Coupon

			vi.mocked(mockAdapter.couponForIdOrCode).mockResolvedValue(incomingCoupon)
			vi.mocked(mockAdapter.getDefaultCoupon).mockResolvedValue({
				defaultCoupon,
				defaultMerchantCoupon: percentCoupon25,
			})
			vi.mocked(mockAdapter.getMerchantCoupon).mockResolvedValue(
				percentCoupon40,
			)
			vi.mocked(mockAdapter.getCoupon).mockResolvedValue(incomingCoupon)

			const request: RequestInternal = {
				body: {
					productId: 'prod_course',
					couponId: 'coupon_incoming',
					quantity: 1,
					autoApplyPPP: false,
				},
				headers: {},
			}

			const response = await getPricesFormatted(request, [], mockOptions)

			expect(response.body).toMatchObject({
				appliedMerchantCoupon: expect.objectContaining({
					id: 'mc_percent_40',
					percentageDiscount: 0.4,
				}),
				appliedDiscountType: 'percentage',
				calculatedPrice: 90, // $150 * 0.60
			})
		})
	})

	describe('Edge Cases', () => {
		it('should use incoming coupon when no default exists', async () => {
			const incomingCoupon: Coupon = {
				id: 'coupon_incoming',
				merchantCouponId: fixedCoupon100.id,
				merchantCoupon: fixedCoupon100,
				maxUses: -1,
				usedCount: 0,
			} as Coupon

			vi.mocked(mockAdapter.couponForIdOrCode).mockResolvedValue(incomingCoupon)
			vi.mocked(mockAdapter.getDefaultCoupon).mockResolvedValue(undefined)
			vi.mocked(mockAdapter.getMerchantCoupon).mockResolvedValue(fixedCoupon100)
			vi.mocked(mockAdapter.getCoupon).mockResolvedValue(incomingCoupon)

			const request: RequestInternal = {
				body: {
					productId: 'prod_course',
					couponId: 'coupon_incoming',
					quantity: 1,
					autoApplyPPP: false,
				},
				headers: {},
			}

			const response = await getPricesFormatted(request, [], mockOptions)

			expect(response.body).toMatchObject({
				appliedMerchantCoupon: expect.objectContaining({
					id: 'mc_fixed_100',
				}),
			})
		})

		it('should use default coupon when no incoming coupon', async () => {
			const defaultCoupon: Coupon = {
				id: 'coupon_default',
				merchantCouponId: percentCoupon40.id,
				merchantCoupon: percentCoupon40,
				maxUses: -1,
				usedCount: 0,
			} as Coupon

			vi.mocked(mockAdapter.couponForIdOrCode).mockResolvedValue(null)
			vi.mocked(mockAdapter.getDefaultCoupon).mockResolvedValue({
				defaultCoupon,
				defaultMerchantCoupon: percentCoupon40,
			})
			vi.mocked(mockAdapter.getMerchantCoupon).mockResolvedValue(
				percentCoupon40,
			)
			vi.mocked(mockAdapter.getCoupon).mockResolvedValue(defaultCoupon)

			const request: RequestInternal = {
				body: {
					productId: 'prod_course',
					quantity: 1,
					autoApplyPPP: false,
				},
				headers: {},
			}

			const response = await getPricesFormatted(request, [], mockOptions)

			expect(response.body).toMatchObject({
				appliedMerchantCoupon: expect.objectContaining({
					id: 'mc_percent_40',
				}),
			})
		})
	})

	describe('Real-World Bug Scenario', () => {
		it('should apply $100 coupon from URL over 40% global coupon on $150 product', async () => {
			// This is the exact bug scenario reported:
			// - Product: $150
			// - Global/default coupon: 40% off = $60 off
			// - URL coupon: $100 off
			// Expected: $100 coupon should be applied (better discount)
			// Bug was: 40% was being applied because comparison only looked at percentageDiscount

			const urlCoupon: Coupon = {
				id: 'coupon_1v4l6',
				merchantCouponId: fixedCoupon100.id,
				merchantCoupon: fixedCoupon100,
				maxUses: -1,
				usedCount: 0,
			} as Coupon

			const globalCoupon: Coupon = {
				id: 'coupon_global',
				merchantCouponId: percentCoupon40.id,
				merchantCoupon: percentCoupon40,
				maxUses: -1,
				usedCount: 0,
			} as Coupon

			vi.mocked(mockAdapter.couponForIdOrCode).mockResolvedValue(urlCoupon)
			vi.mocked(mockAdapter.getDefaultCoupon).mockResolvedValue({
				defaultCoupon: globalCoupon,
				defaultMerchantCoupon: percentCoupon40,
			})
			vi.mocked(mockAdapter.getMerchantCoupon).mockResolvedValue(fixedCoupon100)
			vi.mocked(mockAdapter.getCoupon).mockResolvedValue(urlCoupon)

			const request: RequestInternal = {
				body: {
					productId: 'prod_course',
					couponId: 'coupon_1v4l6', // From URL parameter
					quantity: 1,
					autoApplyPPP: false,
				},
				headers: {},
			}

			const response = await getPricesFormatted(request, [], mockOptions)

			// Should apply the $100 fixed coupon
			expect(response.body).toMatchObject({
				appliedMerchantCoupon: expect.objectContaining({
					id: 'mc_fixed_100',
					amountDiscount: 10000,
				}),
				appliedDiscountType: 'fixed',
				appliedFixedDiscount: 100,
				calculatedPrice: 50, // $150 - $100 = $50
			})

			// Should NOT be the 40% coupon
			expect(
				response.body.appliedMerchantCoupon?.percentageDiscount,
			).toBeFalsy()
		})
	})
})
