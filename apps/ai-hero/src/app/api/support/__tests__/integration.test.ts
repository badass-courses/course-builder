import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// ── Mocks ──────────────────────────────────────────────────────────

const mockDb = {
	select: vi.fn().mockReturnThis(),
	from: vi.fn().mockReturnThis(),
	where: vi.fn().mockReturnThis(),
	leftJoin: vi.fn().mockReturnThis(),
	orderBy: vi.fn().mockReturnThis(),
	limit: vi.fn().mockReturnThis(),
	// final resolution — overridden per test
	then: vi.fn(),
}

// Make the query builder thenable so `await db.select(...)...` works
function makeThenable(resolveValue: any) {
	mockDb.limit.mockImplementation(() => ({
		then: (resolve: any) => resolve(resolveValue),
		[Symbol.iterator]: () => resolveValue[Symbol.iterator](),
	}))
	mockDb.where.mockImplementation(() => {
		// If `.limit()` is not called after `.where()`, resolve directly
		const obj: any = {
			then: (resolve: any) => resolve(resolveValue),
			[Symbol.iterator]: () => resolveValue[Symbol.iterator](),
			orderBy: vi.fn().mockReturnValue({
				limit: vi.fn().mockImplementation(() => ({
					then: (resolve: any) => resolve(resolveValue),
					[Symbol.iterator]: () => resolveValue[Symbol.iterator](),
				})),
				then: (resolve: any) => resolve(resolveValue),
				[Symbol.iterator]: () => resolveValue[Symbol.iterator](),
			}),
			leftJoin: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					orderBy: vi.fn().mockReturnValue({
						limit: vi.fn().mockImplementation(() => ({
							then: (resolve: any) => resolve(resolveValue),
							[Symbol.iterator]: () => resolveValue[Symbol.iterator](),
						})),
					}),
					then: (resolve: any) => resolve(resolveValue),
					[Symbol.iterator]: () => resolveValue[Symbol.iterator](),
				}),
			}),
			limit: vi.fn().mockImplementation(() => ({
				then: (resolve: any) => resolve(resolveValue),
				[Symbol.iterator]: () => resolveValue[Symbol.iterator](),
			})),
		}
		return obj
	})
}

const mockAdapter = {
	getUserByEmail: vi.fn(),
	getPurchasesForUser: vi.fn(),
	getPurchase: vi.fn(),
	getProduct: vi.fn(),
	updatePurchaseStatusForCharge: vi.fn(),
	findOrCreateUser: vi.fn(),
	transferPurchaseToUser: vi.fn(),
	createVerificationToken: vi.fn(),
	updateUser: vi.fn(),
}

vi.mock('@/db', () => ({
	db: mockDb,
	courseBuilderAdapter: mockAdapter,
}))

vi.mock('@/db/schema', () => ({
	contentResource: { id: 'id', type: 'type', fields: 'fields' },
	contentResourceProduct: {
		resourceId: 'resourceId',
		productId: 'productId',
	},
	coupon: {
		id: 'id',
		code: 'code',
		percentageDiscount: 'percentageDiscount',
		amountDiscount: 'amountDiscount',
		expires: 'expires',
		maxUses: 'maxUses',
		usedCount: 'usedCount',
		status: 'status',
		fields: 'fields',
		merchantCouponId: 'merchantCouponId',
	},
	entitlements: {
		id: 'id',
		entitlementType: 'entitlementType',
		sourceType: 'sourceType',
		sourceId: 'sourceId',
		expiresAt: 'expiresAt',
		deletedAt: 'deletedAt',
		organizationId: 'organizationId',
		userId: 'userId',
	},
	entitlementTypes: { id: 'id', name: 'name', description: 'description' },
	merchantCoupon: { id: 'id', type: 'type' },
	organization: { id: 'id', name: 'name', fields: 'fields' },
	organizationMemberships: {
		id: 'id',
		organizationId: 'organizationId',
		userId: 'userId',
		role: 'role',
		createdAt: 'createdAt',
	},
	products: { id: 'id', name: 'name', type: 'type' },
	purchases: { productId: 'productId', status: 'status' },
	resourceProgress: {
		resourceId: 'resourceId',
		userId: 'userId',
		completedAt: 'completedAt',
		updatedAt: 'updatedAt',
		createdAt: 'createdAt',
	},
	users: { id: 'id', email: 'email' },
}))

vi.mock('@/env.mjs', () => ({
	env: {
		NEXT_PUBLIC_URL: 'https://www.aihero.dev',
	},
}))

vi.mock('@/utils/typesense-instantsearch-adapter', () => ({
	TYPESENSE_COLLECTION_NAME: 'test-collection',
}))

vi.mock('typesense', () => ({
	default: {
		Client: vi.fn(),
	},
}))

vi.mock('uuid', () => ({
	v4: () => 'test-uuid-1234',
}))

// ── Import integration after mocks ─────────────────────────────────

import { integration } from '../integration'

// ── Tests ──────────────────────────────────────────────────────────

describe('AI Hero Support Integration', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	// ── lookupUser ─────────────────────────────────────────────────

	describe('lookupUser', () => {
		it('returns user when found', async () => {
			mockAdapter.getUserByEmail.mockResolvedValue({
				id: 'user-1',
				email: 'test@example.com',
				name: 'Test User',
			})

			const result = await integration.lookupUser('test@example.com')

			expect(result).toEqual({
				id: 'user-1',
				email: 'test@example.com',
				name: 'Test User',
				createdAt: expect.any(Date),
			})
			expect(mockAdapter.getUserByEmail).toHaveBeenCalledWith(
				'test@example.com',
			)
		})

		it('returns null when user not found', async () => {
			mockAdapter.getUserByEmail.mockResolvedValue(null)

			const result = await integration.lookupUser('nobody@example.com')

			expect(result).toBeNull()
		})

		it('handles user with no name', async () => {
			mockAdapter.getUserByEmail.mockResolvedValue({
				id: 'user-2',
				email: 'noname@example.com',
				name: null,
			})

			const result = await integration.lookupUser('noname@example.com')

			expect(result).toEqual({
				id: 'user-2',
				email: 'noname@example.com',
				name: undefined,
				createdAt: expect.any(Date),
			})
		})
	})

	// ── getPurchases ───────────────────────────────────────────────

	describe('getPurchases', () => {
		it('returns mapped purchases for a user', async () => {
			mockAdapter.getPurchasesForUser.mockResolvedValue([
				{
					id: 'purchase-1',
					productId: 'prod-1',
					product: { name: 'AI Fundamentals' },
					createdAt: new Date('2024-01-15'),
					totalAmount: '49.99',
					merchantChargeId: 'ch_abc123',
					status: 'Valid',
				},
			])

			const result = await integration.getPurchases('user-1')

			expect(result).toHaveLength(1)
			expect(result[0]).toEqual({
				id: 'purchase-1',
				productId: 'prod-1',
				productName: 'AI Fundamentals',
				purchasedAt: new Date('2024-01-15'),
				amount: 4999, // cents
				currency: 'USD',
				stripeChargeId: 'ch_abc123',
				status: 'active',
			})
		})

		it('returns empty array when user has no purchases', async () => {
			mockAdapter.getPurchasesForUser.mockResolvedValue([])

			const result = await integration.getPurchases('user-1')

			expect(result).toEqual([])
		})

		it('maps refunded status correctly', async () => {
			mockAdapter.getPurchasesForUser.mockResolvedValue([
				{
					id: 'purchase-2',
					productId: 'prod-1',
					product: { name: 'Refunded Course' },
					createdAt: new Date('2024-02-01'),
					totalAmount: '99.00',
					merchantChargeId: null,
					status: 'Refunded',
				},
			])

			const result = await integration.getPurchases('user-1')

			expect(result[0]!.status).toBe('refunded')
			expect(result[0]!.stripeChargeId).toBeUndefined()
		})
	})

	// ── revokeAccess ───────────────────────────────────────────────

	describe('revokeAccess', () => {
		it('revokes access successfully', async () => {
			mockAdapter.getPurchase.mockResolvedValue({
				id: 'purchase-1',
				merchantChargeId: 'ch_abc123',
			})
			mockAdapter.updatePurchaseStatusForCharge.mockResolvedValue(undefined)

			const result = await integration.revokeAccess({
				purchaseId: 'purchase-1',
				reason: 'Customer requested refund',
				refundId: 'refund-1',
			})

			expect(result).toEqual({ success: true })
			expect(
				mockAdapter.updatePurchaseStatusForCharge,
			).toHaveBeenCalledWith('ch_abc123', 'Refunded')
		})

		it('fails when purchase not found', async () => {
			mockAdapter.getPurchase.mockResolvedValue(null)

			const result = await integration.revokeAccess({
				purchaseId: 'nonexistent',
				reason: 'test',
				refundId: 'refund-1',
			})

			expect(result).toEqual({
				success: false,
				error: 'Purchase not found',
			})
		})

		it('fails when no charge ID on purchase', async () => {
			mockAdapter.getPurchase.mockResolvedValue({
				id: 'purchase-1',
				merchantChargeId: null,
			})

			const result = await integration.revokeAccess({
				purchaseId: 'purchase-1',
				reason: 'test',
				refundId: 'refund-1',
			})

			expect(result).toEqual({
				success: false,
				error: 'No charge ID associated with purchase',
			})
		})
	})

	// ── transferPurchase ───────────────────────────────────────────

	describe('transferPurchase', () => {
		it('transfers purchase successfully', async () => {
			mockAdapter.findOrCreateUser.mockResolvedValue({
				user: { id: 'user-2', email: 'recipient@example.com' },
			})
			mockAdapter.transferPurchaseToUser.mockResolvedValue({
				id: 'transfer-1',
			})

			const result = await integration.transferPurchase({
				purchaseId: 'purchase-1',
				fromUserId: 'user-1',
				toEmail: 'recipient@example.com',
			})

			expect(result).toEqual({ success: true })
			expect(mockAdapter.transferPurchaseToUser).toHaveBeenCalledWith({
				purchaseId: 'purchase-1',
				sourceUserId: 'user-1',
				targetUserId: 'user-2',
			})
		})

		it('fails when target user cannot be created', async () => {
			mockAdapter.findOrCreateUser.mockResolvedValue({ user: null })

			const result = await integration.transferPurchase({
				purchaseId: 'purchase-1',
				fromUserId: 'user-1',
				toEmail: 'bad@example.com',
			})

			expect(result).toEqual({
				success: false,
				error: 'Failed to find or create user',
			})
		})

		it('fails when transfer operation fails', async () => {
			mockAdapter.findOrCreateUser.mockResolvedValue({
				user: { id: 'user-2' },
			})
			mockAdapter.transferPurchaseToUser.mockResolvedValue(null)

			const result = await integration.transferPurchase({
				purchaseId: 'purchase-1',
				fromUserId: 'user-1',
				toEmail: 'recipient@example.com',
			})

			expect(result).toEqual({
				success: false,
				error: 'Transfer failed',
			})
		})
	})

	// ── generateMagicLink ──────────────────────────────────────────

	describe('generateMagicLink', () => {
		it('generates a magic link URL', async () => {
			mockAdapter.createVerificationToken.mockResolvedValue(undefined)

			const result = await integration.generateMagicLink({
				email: 'test@example.com',
				expiresIn: 3600,
			})

			expect(result.url).toContain('https://www.aihero.dev')
			expect(result.url).toContain('token=test-uuid-1234')
			expect(result.url).toContain(
				'email=' + encodeURIComponent('test@example.com'),
			)
			expect(mockAdapter.createVerificationToken).toHaveBeenCalledWith({
				identifier: 'test@example.com',
				token: 'test-uuid-1234',
				expires: expect.any(Date),
			})
		})
	})

	// ── updateEmail ────────────────────────────────────────────────

	describe('updateEmail', () => {
		it('updates email when not taken', async () => {
			mockAdapter.getUserByEmail.mockResolvedValue(null)
			mockAdapter.updateUser.mockResolvedValue(undefined)

			const result = await integration.updateEmail({
				userId: 'user-1',
				newEmail: 'new@example.com',
			})

			expect(result).toEqual({ success: true })
			expect(mockAdapter.updateUser).toHaveBeenCalledWith({
				id: 'user-1',
				email: 'new@example.com',
			})
		})

		it('fails when email is already taken by another user', async () => {
			mockAdapter.getUserByEmail.mockResolvedValue({
				id: 'user-other',
				email: 'taken@example.com',
			})

			const result = await integration.updateEmail({
				userId: 'user-1',
				newEmail: 'taken@example.com',
			})

			expect(result).toEqual({
				success: false,
				error: 'Email already in use',
			})
		})

		it('allows updating to same email for same user', async () => {
			mockAdapter.getUserByEmail.mockResolvedValue({
				id: 'user-1',
				email: 'same@example.com',
			})
			mockAdapter.updateUser.mockResolvedValue(undefined)

			const result = await integration.updateEmail({
				userId: 'user-1',
				newEmail: 'same@example.com',
			})

			expect(result).toEqual({ success: true })
		})
	})

	// ── updateName ─────────────────────────────────────────────────

	describe('updateName', () => {
		it('updates name successfully', async () => {
			mockAdapter.updateUser.mockResolvedValue(undefined)

			const result = await integration.updateName({
				userId: 'user-1',
				newName: 'New Name',
			})

			expect(result).toEqual({ success: true })
			expect(mockAdapter.updateUser).toHaveBeenCalledWith({
				id: 'user-1',
				name: 'New Name',
			})
		})

		it('handles adapter error gracefully', async () => {
			mockAdapter.updateUser.mockRejectedValue(new Error('DB failure'))

			const result = await integration.updateName({
				userId: 'user-1',
				newName: 'Broken',
			})

			expect(result).toEqual({
				success: false,
				error: 'DB failure',
			})
		})
	})

	// ── getRefundPolicy ────────────────────────────────────────────

	describe('getRefundPolicy', () => {
		it('returns static refund policy', async () => {
			const policy = await integration.getRefundPolicy()

			expect(policy.autoApproveWindowDays).toBe(30)
			expect(policy.manualApproveWindowDays).toBe(60)
			expect(policy.noRefundAfterDays).toBe(180)
			expect(policy.policyUrl).toBe(
				'https://www.aihero.dev/refund-policy',
			)
			expect(policy.specialConditions).toHaveLength(2)
		})
	})

	// ── getAppInfo ─────────────────────────────────────────────────

	describe('getAppInfo', () => {
		it('returns app metadata', async () => {
			const info = await integration.getAppInfo()

			expect(info.name).toBe('AI Hero')
			expect(info.instructorName).toBe('Matt Pocock')
			expect(info.supportEmail).toBe('team@aihero.dev')
			expect(info.websiteUrl).toContain('aihero.dev')
			expect(info.discordUrl).toBeDefined()
		})
	})

	// ── getCouponInfo ──────────────────────────────────────────────

	describe('getCouponInfo', () => {
		it('returns null for unknown coupon code', async () => {
			// Mock empty result
			makeThenable([])

			const result = await integration.getCouponInfo('FAKECODE')

			expect(result).toBeNull()
		})
	})

	// ── searchContent ──────────────────────────────────────────────

	describe('searchContent', () => {
		it('returns empty results when Typesense is not configured', async () => {
			// Typesense env vars are not set in our mock
			const result = await integration.searchContent({
				query: 'typescript',
			})

			expect(result.results).toEqual([])
			expect(result.quickLinks).toBeDefined()
			expect(result.quickLinks!.length).toBeGreaterThan(0)
		})
	})

	// ── getActivePromotions ────────────────────────────────────────

	describe('getActivePromotions', () => {
		it('returns empty array when no active promotions', async () => {
			makeThenable([])

			const result = await integration.getActivePromotions()

			expect(result).toEqual([])
		})
	})

	// ── getLicenseInfo ──────────────────────────────────────────────

	describe('getLicenseInfo', () => {
		it('returns null when purchase not found', async () => {
			mockAdapter.getPurchase.mockResolvedValue(null)

			const result = await integration.getLicenseInfo('nonexistent')

			expect(result).toBeNull()
		})

		it('returns individual license for non-org purchase', async () => {
			mockAdapter.getPurchase.mockResolvedValue({
				id: 'purchase-1',
				productId: 'prod-1',
			})

			const result = await integration.getLicenseInfo('purchase-1')

			expect(result).toEqual({
				purchaseId: 'purchase-1',
				licenseType: 'individual',
				totalSeats: 1,
				claimedSeats: 1,
				availableSeats: 0,
				claimedBy: [],
			})
		})
	})
})
