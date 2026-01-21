import { describe, expect, it } from 'vitest'

import {
	canAccessResourceTier,
	filterResourcesByTier,
	getActiveSubscriptionTier,
	getResourceTierFromModule,
} from '../subscription-tier-access'

describe('canAccessResourceTier', () => {
	describe('Pro subscription', () => {
		it('can access pro tier resources', () => {
			expect(canAccessResourceTier('pro', 'pro')).toBe(true)
		})

		it('can access standard tier resources', () => {
			expect(canAccessResourceTier('pro', 'standard')).toBe(true)
		})

		it('can access free tier resources', () => {
			expect(canAccessResourceTier('pro', 'free')).toBe(true)
		})

		it('can access undefined tier resources', () => {
			expect(canAccessResourceTier('pro', undefined)).toBe(true)
		})
	})

	describe('Standard subscription', () => {
		it('CANNOT access pro tier resources', () => {
			expect(canAccessResourceTier('standard', 'pro')).toBe(false)
		})

		it('can access standard tier resources', () => {
			expect(canAccessResourceTier('standard', 'standard')).toBe(true)
		})

		it('can access free tier resources', () => {
			expect(canAccessResourceTier('standard', 'free')).toBe(true)
		})

		it('can access undefined tier resources', () => {
			expect(canAccessResourceTier('standard', undefined)).toBe(true)
		})
	})

	describe('No subscription', () => {
		it('CANNOT access pro tier resources', () => {
			expect(canAccessResourceTier(null, 'pro')).toBe(false)
		})

		it('CANNOT access standard tier resources', () => {
			expect(canAccessResourceTier(null, 'standard')).toBe(false)
		})

		it('can access free tier resources', () => {
			expect(canAccessResourceTier(null, 'free')).toBe(true)
		})

		it('can access undefined tier resources', () => {
			expect(canAccessResourceTier(null, undefined)).toBe(true)
		})
	})
})

describe('getActiveSubscriptionTier', () => {
	const subscriptionTypeId = 'sub_access_type'

	it('returns pro tier when entitlement metadata has tier=pro', () => {
		const entitlements = [
			{
				type: subscriptionTypeId,
				expires: new Date(Date.now() + 86400000), // 1 day in future
				metadata: { tier: 'pro' },
			},
		]

		expect(getActiveSubscriptionTier(entitlements, subscriptionTypeId)).toBe(
			'pro',
		)
	})

	it('returns standard tier when entitlement metadata has tier=standard', () => {
		const entitlements = [
			{
				type: subscriptionTypeId,
				expires: null,
				metadata: { tier: 'standard' },
			},
		]

		expect(getActiveSubscriptionTier(entitlements, subscriptionTypeId)).toBe(
			'standard',
		)
	})

	it('defaults to standard tier when no tier specified', () => {
		const entitlements = [
			{
				type: subscriptionTypeId,
				expires: null,
				metadata: {},
			},
		]

		expect(getActiveSubscriptionTier(entitlements, subscriptionTypeId)).toBe(
			'standard',
		)
	})

	it('returns null when subscription is expired', () => {
		const entitlements = [
			{
				type: subscriptionTypeId,
				expires: new Date(Date.now() - 86400000), // 1 day in past
				metadata: { tier: 'pro' },
			},
		]

		expect(getActiveSubscriptionTier(entitlements, subscriptionTypeId)).toBe(
			null,
		)
	})

	it('returns null when no matching entitlement', () => {
		const entitlements = [
			{
				type: 'other_type',
				expires: null,
				metadata: { tier: 'pro' },
			},
		]

		expect(getActiveSubscriptionTier(entitlements, subscriptionTypeId)).toBe(
			null,
		)
	})

	it('returns null when entitlements array is undefined', () => {
		expect(getActiveSubscriptionTier(undefined, subscriptionTypeId)).toBe(null)
	})

	it('returns null when entitlements array is empty', () => {
		expect(getActiveSubscriptionTier([], subscriptionTypeId)).toBe(null)
	})
})

describe('filterResourcesByTier', () => {
	const resources = [
		{ id: '1', metadata: { tier: 'pro' as const } },
		{ id: '2', metadata: { tier: 'standard' as const } },
		{ id: '3', metadata: { tier: 'free' as const } },
		{ id: '4', metadata: {} },
		{ id: '5' }, // No metadata
	]

	it('pro subscription gets all resources', () => {
		const filtered = filterResourcesByTier(resources, 'pro')
		expect(filtered).toHaveLength(5)
	})

	it('standard subscription gets standard, free, and undefined tier resources', () => {
		const filtered = filterResourcesByTier(resources, 'standard')
		expect(filtered).toHaveLength(4)
		expect(filtered.map((r) => r.id)).toEqual(['2', '3', '4', '5'])
	})

	it('no subscription gets only free and undefined tier resources', () => {
		const filtered = filterResourcesByTier(resources, null)
		expect(filtered).toHaveLength(3)
		expect(filtered.map((r) => r.id)).toEqual(['3', '4', '5'])
	})
})

describe('getResourceTierFromModule', () => {
	const moduleResources = [
		{ resourceId: 'res-1', metadata: { tier: 'pro' as const } },
		{ resourceId: 'res-2', metadata: { tier: 'standard' as const } },
		{ resource: { id: 'res-3' }, metadata: { tier: 'free' as const } },
		{ resourceId: 'res-4', metadata: {} },
	]

	it('finds tier by resourceId', () => {
		expect(getResourceTierFromModule(moduleResources, 'res-1')).toBe('pro')
		expect(getResourceTierFromModule(moduleResources, 'res-2')).toBe('standard')
	})

	it('finds tier by resource.id', () => {
		expect(getResourceTierFromModule(moduleResources, 'res-3')).toBe('free')
	})

	it('returns undefined for unknown resource', () => {
		expect(getResourceTierFromModule(moduleResources, 'unknown')).toBe(
			undefined,
		)
	})

	it('returns undefined for resource without tier', () => {
		expect(getResourceTierFromModule(moduleResources, 'res-4')).toBe(undefined)
	})

	it('handles undefined moduleResources', () => {
		expect(getResourceTierFromModule(undefined, 'res-1')).toBe(undefined)
	})
})
