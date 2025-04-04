import type { Coupon, Purchase } from '@coursebuilder/core/schemas'

import {
	bulkCouponHasSeats,
	hasAvailableSeats,
	hasBulkPurchase,
	hasInvoice,
	hasValidPurchase,
} from './purchase-validators'

test('coupon has seats left if used count less than maxUses', () => {
	const coupon = {
		maxUses: 1,
		usedCount: 0,
	} as Coupon
	expect(bulkCouponHasSeats(coupon)).toBe(true)
})

test('coupon has no seats left if used count equal to maxUses', () => {
	const coupon = {
		maxUses: 1,
		usedCount: 1,
	} as Coupon
	expect(bulkCouponHasSeats(coupon)).toBe(false)
})

test('coupon has no seats left if used count greater then maxUses', () => {
	const coupon = {
		maxUses: 1,
		usedCount: 66,
	} as Coupon
	expect(bulkCouponHasSeats(coupon)).toBe(false)
})

// test hasAvailableSeats with jest
test('has available seats if a purchase exists with a bulk coupon with seats', () => {
	const purchases = [
		{
			bulkCoupon: {
				maxUses: 1,
				usedCount: 0,
			},
		},
	] as Purchase[]
	expect(hasAvailableSeats(purchases)).toBe(true)
})

test('has no available seats if a purchase exists with a bulk coupon without seats', () => {
	const purchases = [
		{
			bulkCoupon: {
				maxUses: 1,
				usedCount: 2,
			},
		},
	] as Purchase[]
	expect(hasAvailableSeats(purchases)).toBe(false)
})

test('has a valid purchase', () => {
	const purchases = [{ status: 'Valid' }] as Purchase[]
	expect(hasValidPurchase(purchases)).toBe(true)
})

test('has an invalid purchase because it has a bulk coupon', () => {
	const purchases = [
		{
			bulkCoupon: {
				maxUses: 1,
				usedCount: 2,
			},
		},
	] as Purchase[]
	expect(hasValidPurchase(purchases)).toBe(false)
})

test('has a bulk purchase', () => {
	const purchases = [
		{},
		{
			bulkCoupon: {
				maxUses: 1,
				usedCount: 2,
			},
		},
	] as Purchase[]
	expect(hasBulkPurchase(purchases)).toBe(true)
})

test('hasInvoice', () => {
	const purchases = [
		{
			merchantChargeId: '123',
		},
	] as Purchase[]
	expect(hasInvoice(purchases)).toBe(true)
})
