import { createAppAbility, defineRulesForPurchases, User } from '@/ability'
import { describe, expect, it, vi } from 'vitest'

/**
 * Tests for the subscription entitlement system.
 * These tests verify that:
 * - Subscription entitlements grant access to all content
 * - Expired subscriptions do not grant access
 * - Subscription access coexists with purchase-based access
 *
 * Note: Workshops without resourceProducts are considered "freely watchable"
 * so we include resourceProducts in test modules to simulate paid content.
 */

describe('Subscription Entitlements', () => {
	const subscriptionEntitlementTypeId = 'sub_access_type_id'
	const workshopEntitlementTypeId = 'workshop_access_type_id'
	const cohortEntitlementTypeId = 'cohort_access_type_id'

	const entitlementTypes = [
		{ id: subscriptionEntitlementTypeId, name: 'subscription_access' },
		{ id: workshopEntitlementTypeId, name: 'workshop_content_access' },
		{ id: cohortEntitlementTypeId, name: 'cohort_content_access' },
	]

	// Mock subscription product ID (used in entitlements and module)
	const subscriptionProductId = 'prod-membership'

	// Mock a paid workshop (has self-paced product attached to subscription)
	const paidWorkshopModule = {
		id: 'workshop-123',
		type: 'workshop',
		resourceProducts: [
			{ productId: subscriptionProductId, product: { type: 'self-paced' } },
		],
	} as any

	describe('Active Subscription', () => {
		it('grants access to all content when user has active subscription', () => {
			const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) // 30 days
			const user: User = {
				id: 'user-123',
				email: 'test@example.com',
				entitlements: [
					{
						type: subscriptionEntitlementTypeId,
						expires: futureDate,
						metadata: {
							subscriptionId: 'sub-123',
							productId: 'prod-membership',
						},
					},
				],
			}

			const rules = defineRulesForPurchases({
				user,
				entitlementTypes,
				module: paidWorkshopModule,
			})

			const ability = createAppAbility(rules)
			expect(ability.can('read', 'Content')).toBe(true)
		})

		it('grants access to all content when subscription has no expiration', () => {
			const user: User = {
				id: 'user-123',
				email: 'test@example.com',
				entitlements: [
					{
						type: subscriptionEntitlementTypeId,
						expires: null,
						metadata: {
							subscriptionId: 'sub-123',
							productId: 'prod-membership',
						},
					},
				],
			}

			const rules = defineRulesForPurchases({
				user,
				entitlementTypes,
				module: paidWorkshopModule,
			})

			const ability = createAppAbility(rules)
			expect(ability.can('read', 'Content')).toBe(true)
		})

		it('grants Discord access for subscribers', () => {
			const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
			const user: User = {
				id: 'user-123',
				email: 'test@example.com',
				entitlements: [
					{
						type: subscriptionEntitlementTypeId,
						expires: futureDate,
						metadata: {},
					},
				],
			}

			const rules = defineRulesForPurchases({
				user,
				entitlementTypes,
			})

			const ability = createAppAbility(rules)
			expect(ability.can('read', 'Discord')).toBe(true)
		})
	})

	describe('Expired Subscription', () => {
		it('does NOT grant Discord access when subscription is expired', () => {
			const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
			const user: User = {
				id: 'user-123',
				email: 'test@example.com',
				entitlements: [
					{
						type: subscriptionEntitlementTypeId,
						expires: pastDate,
						metadata: {},
					},
				],
			}

			const rules = defineRulesForPurchases({
				user,
				entitlementTypes,
				module: paidWorkshopModule,
			})

			const ability = createAppAbility(rules)
			// Discord access should be revoked when subscription expires
			expect(ability.can('read', 'Discord')).toBe(false)
		})
	})

	describe('No Subscription', () => {
		it('does NOT grant Discord access without subscription', () => {
			const user: User = {
				id: 'user-123',
				email: 'test@example.com',
				entitlements: [],
			}

			const rules = defineRulesForPurchases({
				user,
				entitlementTypes,
				module: paidWorkshopModule,
			})

			const ability = createAppAbility(rules)
			expect(ability.can('read', 'Discord')).toBe(false)
		})
	})

	describe('Mixed Entitlements', () => {
		it('purchase-based access still works alongside subscription', () => {
			const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
			const user: User = {
				id: 'user-123',
				email: 'test@example.com',
				entitlements: [
					// Has both subscription and workshop purchase
					{
						type: subscriptionEntitlementTypeId,
						expires: futureDate,
						metadata: {},
					},
					{
						type: workshopEntitlementTypeId,
						expires: null,
						metadata: {
							contentIds: ['workshop-specific-123'],
						},
					},
				],
			}

			const rules = defineRulesForPurchases({
				user,
				entitlementTypes,
				module: {
					...paidWorkshopModule,
					id: 'workshop-specific-123',
				},
				allModuleResourceIds: ['lesson-1', 'lesson-2'],
			})

			const ability = createAppAbility(rules)
			// Both should grant access
			expect(ability.can('read', 'Content')).toBe(true)
			expect(ability.can('read', 'Discord')).toBe(true)
		})

		it('workshop purchase grants access to content but NOT Discord without subscription', () => {
			const user: User = {
				id: 'user-123',
				email: 'test@example.com',
				entitlements: [
					{
						type: workshopEntitlementTypeId,
						expires: null,
						metadata: {
							contentIds: ['workshop-123'],
						},
					},
				],
			}

			const rules = defineRulesForPurchases({
				user,
				entitlementTypes,
				module: paidWorkshopModule,
				allModuleResourceIds: ['lesson-1', 'lesson-2'],
			})

			const ability = createAppAbility(rules)
			// Workshop entitlement grants Content access via id matching
			expect(ability.can('read', 'Content')).toBe(true)
			// But should NOT have Discord access without subscription
			expect(ability.can('read', 'Discord')).toBe(false)
		})
	})
})

describe('Subscription Entitlement Type Validation', () => {
	it('ignores entitlements with wrong type', () => {
		const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
		const user: User = {
			id: 'user-123',
			email: 'test@example.com',
			entitlements: [
				{
					type: 'some-other-type', // Not subscription_access
					expires: futureDate,
					metadata: {},
				},
			],
		}

		const entitlementTypes = [{ id: 'sub_access', name: 'subscription_access' }]

		const rules = defineRulesForPurchases({
			user,
			entitlementTypes,
		})

		const ability = createAppAbility(rules)
		// No Discord access without valid subscription
		expect(ability.can('read', 'Discord')).toBe(false)
	})

	it('handles missing entitlementTypes gracefully', () => {
		const user: User = {
			id: 'user-123',
			email: 'test@example.com',
			entitlements: [
				{
					type: 'sub_access',
					expires: null,
					metadata: {},
				},
			],
		}

		// No entitlementTypes passed
		const rules = defineRulesForPurchases({
			user,
			entitlementTypes: undefined,
		})

		const ability = createAppAbility(rules)
		// Should not crash, just won't grant subscription-based Discord access
		expect(ability.can('read', 'Discord')).toBe(false)
	})
})
