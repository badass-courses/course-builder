import type { Coupon, Purchase } from '@coursebuilder/core/schemas'

import {
	bulkCouponHasSeats,
	hasAvailableSeats,
	hasBulkPurchase,
	hasInvoice,
	hasTeamSubscription,
	hasValidPurchase,
	type TeamSubscriptionSeatInfo,
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

// Team subscription tests
test('hasTeamSubscription returns true when team subscriptions exist', () => {
	const subscriptions: TeamSubscriptionSeatInfo[] = [
		{ subscriptionId: 'sub_1', totalSeats: 5, usedSeats: 2 },
	]
	expect(hasTeamSubscription(subscriptions)).toBe(true)
})

test('hasTeamSubscription returns false when no team subscriptions', () => {
	expect(hasTeamSubscription([])).toBe(false)
	expect(hasTeamSubscription(undefined)).toBe(false)
})

test('hasAvailableSeats returns true for team subscription with available seats', () => {
	const subscriptions: TeamSubscriptionSeatInfo[] = [
		{ subscriptionId: 'sub_1', totalSeats: 5, usedSeats: 2 },
	]
	expect(hasAvailableSeats([], subscriptions)).toBe(true)
})

test('hasAvailableSeats returns false for fully used team subscription', () => {
	const subscriptions: TeamSubscriptionSeatInfo[] = [
		{ subscriptionId: 'sub_1', totalSeats: 5, usedSeats: 5 },
	]
	expect(hasAvailableSeats([], subscriptions)).toBe(false)
})

test('hasAvailableSeats returns true if either bulk purchase OR team subscription has seats', () => {
	const purchases = [
		{
			bulkCoupon: {
				maxUses: 1,
				usedCount: 1, // full
			},
		},
	] as Purchase[]
	const subscriptions: TeamSubscriptionSeatInfo[] = [
		{ subscriptionId: 'sub_1', totalSeats: 5, usedSeats: 2 }, // has seats
	]
	expect(hasAvailableSeats(purchases, subscriptions)).toBe(true)
})
