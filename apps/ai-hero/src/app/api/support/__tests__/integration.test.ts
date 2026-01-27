import { beforeEach, describe, expect, it, vi } from 'vitest'

// ── Mocks ──────────────────────────────────────────────────────────
// vi.mock is hoisted to the top of the file, so we must use vi.hoisted()
// to ensure mock objects exist before the factory runs.

const { mockDb, mockAdapter } = vi.hoisted(() => {
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

	const mockAdapter = {
		getUserByEmail: vi.fn(),
		getPurchasesForUser: vi.fn(),
		getPurchase: vi.fn(),
		getProduct: vi.fn(),
		getProductResources: vi.fn(),
		getContentResource: vi.fn(),
		updatePurchaseStatusForCharge: vi.fn(),
		findOrCreateUser: vi.fn(),
		transferPurchaseToUser: vi.fn(),
		createVerificationToken: vi.fn(),
		updateUser: vi.fn(),
		// Adapter helpers used by refactored methods
		getDefaultCoupon: vi.fn(),
		couponForIdOrCode: vi.fn(),
		getEntitlementsForUser: vi.fn(),
		getMembershipsForUser: vi.fn(),
		getLessonProgressForUser: vi.fn(),
		getOrganization: vi.fn(),
		getOrganizationMembers: vi.fn(),
	}

	return { mockDb, mockAdapter }
})

// Make the query builder thenable so `await db.select(...)...` works
// Still needed for getProductStatus which uses raw db for purchase count
function makeThenable(resolveValue: any) {
	mockDb.limit.mockImplementation(() => ({
		then: (resolve: any) => resolve(resolveValue),
		[Symbol.iterator]: () => resolveValue[Symbol.iterator](),
	}))
	mockDb.where.mockImplementation(() => {
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

vi.mock('@/db', () => ({
	db: mockDb,
	courseBuilderAdapter: mockAdapter,
}))

vi.mock('@/db/schema', () => ({
	purchases: { productId: 'productId', status: 'status' },
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
			mockAdapter.couponForIdOrCode.mockResolvedValue(null)

			const result = await integration.getCouponInfo('FAKECODE')

			expect(result).toBeNull()
			expect(mockAdapter.couponForIdOrCode).toHaveBeenCalledWith({
				code: 'FAKECODE',
			})
		})

		it('returns coupon info for a valid coupon', async () => {
			mockAdapter.couponForIdOrCode.mockResolvedValue({
				id: 'coupon-1',
				code: 'SAVE30',
				percentageDiscount: 0.3,
				amountDiscount: null,
				expires: new Date('2025-12-31'),
				maxUses: 100,
				usedCount: 5,
				status: 1,
				fields: {},
				default: false,
				merchantCouponId: 'mc-1',
				bulkPurchases: [],
				redeemedBulkCouponPurchases: [],
				createdAt: new Date(),
				restrictedToProductId: null,
				merchantCoupon: {
					id: 'mc-1',
					type: 'special',
					merchantAccountId: 'ma-1',
					status: 0,
				},
			})

			const result = await integration.getCouponInfo('SAVE30')

			expect(result).toEqual({
				code: 'SAVE30',
				valid: true,
				discountType: 'percent',
				discountAmount: 30,
				restrictionType: 'general',
				usageCount: 5,
				maxUses: 100,
				expiresAt: new Date('2025-12-31').toISOString(),
			})
		})

		it('returns invalid when coupon is exhausted', async () => {
			mockAdapter.couponForIdOrCode.mockResolvedValue({
				id: 'coupon-2',
				code: 'USED',
				percentageDiscount: 0.1,
				amountDiscount: null,
				expires: null,
				maxUses: 5,
				usedCount: 5,
				status: 1,
				fields: {},
				default: false,
				merchantCouponId: 'mc-1',
				bulkPurchases: [],
				redeemedBulkCouponPurchases: [],
				createdAt: new Date(),
				restrictedToProductId: null,
				merchantCoupon: {
					id: 'mc-1',
					type: 'ppp',
					merchantAccountId: 'ma-1',
					status: 0,
				},
			})

			const result = await integration.getCouponInfo('USED')

			expect(result).not.toBeNull()
			expect(result!.valid).toBe(false)
			expect(result!.restrictionType).toBe('ppp')
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
			mockAdapter.getDefaultCoupon.mockResolvedValue(null)

			const result = await integration.getActivePromotions()

			expect(result).toEqual([])
			expect(mockAdapter.getDefaultCoupon).toHaveBeenCalled()
		})

		it('returns promotion when default coupon is active', async () => {
			mockAdapter.getDefaultCoupon.mockResolvedValue({
				defaultCoupon: {
					id: 'coupon-1',
					code: 'SALE2024',
					percentageDiscount: 0.4,
					amountDiscount: null,
					expires: new Date('2025-06-01'),
					maxUses: -1,
					usedCount: 42,
					status: 1,
					default: true,
					fields: { name: 'Summer Sale' },
				},
				defaultMerchantCoupon: {
					id: 'mc-1',
					type: 'special',
					merchantAccountId: 'ma-1',
					status: 0,
				},
			})

			const result = await integration.getActivePromotions()

			expect(result).toHaveLength(1)
			expect(result[0]).toEqual({
				id: 'coupon-1',
				name: 'Summer Sale',
				code: 'SALE2024',
				discountType: 'percent',
				discountAmount: 40,
				validUntil: new Date('2025-06-01').toISOString(),
				active: true,
				conditions: 'Special promotion',
			})
		})
	})

	// ── getContentAccess ───────────────────────────────────────────

	describe('getContentAccess', () => {
		it('returns empty access for user with no purchases or memberships', async () => {
			mockAdapter.getEntitlementsForUser.mockResolvedValue([])
			mockAdapter.getPurchasesForUser.mockResolvedValue([])
			mockAdapter.getMembershipsForUser.mockResolvedValue([])

			const result = await integration.getContentAccess('user-1')

			expect(result).toEqual({
				userId: 'user-1',
				products: [],
				teamMembership: undefined,
			})
		})

		it('returns product access from purchases', async () => {
			mockAdapter.getEntitlementsForUser.mockResolvedValue([])
			mockAdapter.getPurchasesForUser.mockResolvedValue([
				{
					id: 'purchase-1',
					productId: 'prod-1',
					status: 'Valid',
					createdAt: new Date(),
					totalAmount: 49.99,
				},
			])
			mockAdapter.getProduct.mockResolvedValue({
				id: 'prod-1',
				name: 'AI Fundamentals',
				type: 'self-paced',
				fields: {},
			})
			mockAdapter.getProductResources.mockResolvedValue([
				{
					id: 'resource-1',
					type: 'lesson',
					fields: { title: 'Intro to AI' },
				},
			])
			mockAdapter.getMembershipsForUser.mockResolvedValue([])

			const result = await integration.getContentAccess('user-1')

			expect(result.products).toHaveLength(1)
			expect(result.products[0]).toEqual({
				productId: 'prod-1',
				productName: 'AI Fundamentals',
				accessLevel: 'full',
				modules: [{ id: 'resource-1', title: 'Intro to AI', accessible: true }],
				expiresAt: undefined,
			})
		})

		it('includes team membership when user belongs to org', async () => {
			mockAdapter.getEntitlementsForUser.mockResolvedValue([])
			mockAdapter.getPurchasesForUser.mockResolvedValue([])
			mockAdapter.getMembershipsForUser.mockResolvedValue([
				{
					id: 'membership-1',
					organizationId: 'org-1',
					role: 'user',
					userId: 'user-1',
					invitedById: 'owner-1',
					fields: {},
					createdAt: new Date('2024-03-01'),
					organization: { id: 'org-1', name: 'Acme Corp', fields: {}, image: null, createdAt: new Date() },
					user: { id: 'user-1', email: 'test@example.com', name: 'Test' },
				},
			])

			const result = await integration.getContentAccess('user-1')

			expect(result.teamMembership).toEqual({
				teamId: 'org-1',
				teamName: 'Acme Corp',
				role: 'member',
				seatClaimedAt: new Date('2024-03-01').toISOString(),
			})
		})
	})

	// ── getRecentActivity ──────────────────────────────────────────

	describe('getRecentActivity', () => {
		it('returns empty activity for user with no progress', async () => {
			mockAdapter.getLessonProgressForUser.mockResolvedValue([])

			const result = await integration.getRecentActivity('user-1')

			expect(result).toEqual({
				userId: 'user-1',
				lastActiveAt: undefined,
				lessonsCompleted: 0,
				totalLessons: 0,
				completionPercent: 0,
				recentItems: [],
			})
		})

		it('computes progress from adapter data', async () => {
			const completedDate = new Date('2024-06-15T10:00:00Z')
			mockAdapter.getLessonProgressForUser.mockResolvedValue([
				{ userId: 'user-1', resourceId: 'lesson-1', completedAt: completedDate },
				{ userId: 'user-1', resourceId: 'lesson-2', completedAt: null },
				{ userId: 'user-1', resourceId: 'lesson-3', completedAt: new Date('2024-06-14T09:00:00Z') },
			])
			mockAdapter.getContentResource
				.mockResolvedValueOnce({
					id: 'lesson-1',
					type: 'lesson',
					fields: { title: 'Getting Started' },
				})
				.mockResolvedValueOnce({
					id: 'lesson-3',
					type: 'lesson',
					fields: { title: 'Advanced Topics' },
				})

			const result = await integration.getRecentActivity('user-1')

			expect(result.lessonsCompleted).toBe(2)
			expect(result.totalLessons).toBe(3)
			expect(result.completionPercent).toBe(67)
			expect(result.lastActiveAt).toBe(completedDate.toISOString())
			expect(result.recentItems).toHaveLength(2)
			expect(result.recentItems[0]).toEqual({
				type: 'lesson_completed',
				title: 'Getting Started',
				timestamp: completedDate.toISOString(),
			})
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

		it('returns team license for org purchase', async () => {
			mockAdapter.getPurchase.mockResolvedValue({
				id: 'purchase-1',
				productId: 'prod-1',
				organizationId: 'org-1',
			})
			mockAdapter.getOrganization.mockResolvedValue({
				id: 'org-1',
				name: 'Acme Corp',
				fields: { maxSeats: 10 },
				image: null,
				createdAt: new Date(),
			})
			mockAdapter.getOrganizationMembers.mockResolvedValue([
				{
					id: 'member-1',
					organizationId: 'org-1',
					role: 'owner',
					userId: 'user-1',
					invitedById: 'user-1',
					fields: {},
					createdAt: new Date('2024-01-01'),
					organization: { id: 'org-1', name: 'Acme Corp' },
					user: { id: 'user-1', email: 'admin@acme.com', name: 'Admin' },
				},
				{
					id: 'member-2',
					organizationId: 'org-1',
					role: 'user',
					userId: 'user-2',
					invitedById: 'user-1',
					fields: {},
					createdAt: new Date('2024-02-01'),
					organization: { id: 'org-1', name: 'Acme Corp' },
					user: { id: 'user-2', email: 'dev@acme.com', name: 'Dev' },
				},
			])

			const result = await integration.getLicenseInfo('purchase-1')

			expect(result).toEqual({
				purchaseId: 'purchase-1',
				licenseType: 'team',
				totalSeats: 10,
				claimedSeats: 2,
				availableSeats: 8,
				claimedBy: [
					{ email: 'admin@acme.com', claimedAt: new Date('2024-01-01').toISOString() },
					{ email: 'dev@acme.com', claimedAt: new Date('2024-02-01').toISOString() },
				],
				adminEmail: 'admin@acme.com',
			})
		})
	})
})
