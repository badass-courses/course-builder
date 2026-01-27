import { courseBuilderAdapter, db } from '@/db'
import { purchases } from '@/db/schema'
import { env } from '@/env.mjs'
import { TYPESENSE_COLLECTION_NAME } from '@/utils/typesense-instantsearch-adapter'
import type {
	ActionResult,
	AppInfo,
	ContentAccess,
	ContentSearchRequest,
	ContentSearchResponse,
	ContentSearchResult,
	CouponInfo,
	LicenseInfo,
	ProductStatus,
	Promotion,
	Purchase,
	RefundPolicy,
	SupportIntegration,
	User,
	UserActivity,
} from '@skillrecordings/sdk/integration'
import { and, eq, inArray, sql } from 'drizzle-orm'
import Typesense from 'typesense'
import { v4 as uuidv4 } from 'uuid'

/**
 * Support Platform Integration for AI Hero
 *
 * Implements the SupportIntegration interface to allow the support agent
 * to look up users, purchases, and perform actions like refunds and transfers.
 *
 * Uses courseBuilderAdapter for all database operations to ensure consistency
 * with the rest of the application (organization setup, proper relations, etc.)
 */
export const integration: SupportIntegration = {
	/**
	 * Look up user by email address
	 */
	async lookupUser(email: string): Promise<User | null> {
		const user = await courseBuilderAdapter.getUserByEmail?.(email)
		if (!user) return null

		return {
			id: user.id,
			email: user.email,
			name: user.name ?? undefined,
			createdAt: new Date(), // Adapter doesn't return createdAt
		}
	},

	/**
	 * Get all purchases for a user
	 */
	async getPurchases(userId: string): Promise<Purchase[]> {
		const userPurchases = await courseBuilderAdapter.getPurchasesForUser(userId)

		return userPurchases.map((p: any) => ({
			id: p.id,
			productId: p.productId,
			productName: p.product?.name ?? 'Unknown Product',
			purchasedAt: p.createdAt,
			amount: Math.round(Number(p.totalAmount) * 100), // Convert to cents
			currency: 'USD',
			stripeChargeId: p.merchantChargeId ?? undefined,
			status: mapPurchaseStatus(p.status ?? 'Valid'),
		}))
	},

	/**
	 * Revoke access after refund (called after Stripe refund succeeds)
	 */
	async revokeAccess({
		purchaseId,
		reason,
		refundId,
	}: {
		purchaseId: string
		reason: string
		refundId: string
	}): Promise<ActionResult> {
		try {
			// Get the purchase to find the charge ID
			const purchase = await courseBuilderAdapter.getPurchase(purchaseId)
			if (!purchase) {
				return { success: false, error: 'Purchase not found' }
			}

			if (!purchase.merchantChargeId) {
				return {
					success: false,
					error: 'No charge ID associated with purchase',
				}
			}

			// Use adapter to update purchase status
			await courseBuilderAdapter.updatePurchaseStatusForCharge(
				purchase.merchantChargeId,
				'Refunded',
			)

			return { success: true }
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			}
		}
	},

	/**
	 * Transfer purchase to new owner
	 */
	async transferPurchase({
		purchaseId,
		fromUserId,
		toEmail,
	}: {
		purchaseId: string
		fromUserId: string
		toEmail: string
	}): Promise<ActionResult> {
		try {
			// Find or create the target user via adapter
			const { user: toUser } =
				await courseBuilderAdapter.findOrCreateUser(toEmail)

			if (!toUser) {
				return { success: false, error: 'Failed to find or create user' }
			}

			// Use adapter to transfer the purchase
			const transfer = await courseBuilderAdapter.transferPurchaseToUser({
				purchaseId,
				sourceUserId: fromUserId,
				targetUserId: toUser.id,
			})

			if (!transfer) {
				return { success: false, error: 'Transfer failed' }
			}

			return { success: true }
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			}
		}
	},

	/**
	 * Generate magic link for passwordless login
	 */
	async generateMagicLink({
		email,
		expiresIn,
	}: {
		email: string
		expiresIn: number
	}): Promise<{ url: string }> {
		const token = uuidv4()
		const expires = new Date(Date.now() + expiresIn * 1000)

		// Create verification token using the adapter
		await courseBuilderAdapter.createVerificationToken?.({
			identifier: email,
			token,
			expires,
		})

		const baseUrl = env.NEXT_PUBLIC_URL || 'https://www.aihero.dev'
		const callbackUrl = encodeURIComponent(baseUrl)
		const url = `${baseUrl}/api/auth/callback/email?callbackUrl=${callbackUrl}&token=${token}&email=${encodeURIComponent(email)}`

		return { url }
	},

	/**
	 * Update user's email address
	 */
	async updateEmail({
		userId,
		newEmail,
	}: {
		userId: string
		newEmail: string
	}): Promise<ActionResult> {
		try {
			// Check if email is already taken
			const existing = await courseBuilderAdapter.getUserByEmail?.(newEmail)

			if (existing && existing.id !== userId) {
				return { success: false, error: 'Email already in use' }
			}

			// Use adapter's updateUser method with just the fields to update
			await courseBuilderAdapter.updateUser?.({
				id: userId,
				email: newEmail,
			})

			return { success: true }
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			}
		}
	},

	/**
	 * Update user's display name
	 */
	async updateName({
		userId,
		newName,
	}: {
		userId: string
		newName: string
	}): Promise<ActionResult> {
		try {
			// Use adapter's updateUser method with just the fields to update
			await courseBuilderAdapter.updateUser?.({
				id: userId,
				name: newName,
			})

			return { success: true }
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			}
		}
	},

	/**
	 * Get product availability status
	 *
	 * Returns seat availability, sold out status, and enrollment windows
	 * for live workshops and cohort-based products.
	 */
	async getProductStatus(productId: string): Promise<ProductStatus | null> {
		// Get product via adapter (handles slug or ID lookup)
		const product = await courseBuilderAdapter.getProduct(productId)

		if (!product) return null

		// Count active purchases for this product
		const activePurchases = await db
			.select({ count: sql<number>`count(*)` })
			.from(purchases)
			.where(
				and(
					eq(purchases.productId, product.id),
					inArray(purchases.status, ['Valid', 'Restricted']),
				),
			)
		const activePurchaseCount = Number(activePurchases[0]?.count ?? 0)

		const quantityAvailable = product.quantityAvailable ?? -1
		const isUnlimited = quantityAvailable === -1
		const quantityRemaining = isUnlimited
			? -1
			: Math.max(0, quantityAvailable - activePurchaseCount)
		const soldOut = !isUnlimited && quantityRemaining <= 0

		// Map product fields.state to SDK state
		const stateMap: Record<string, ProductStatus['state']> = {
			draft: 'draft',
			published: 'active',
			archived: 'archived',
			deleted: 'archived',
		}
		const state = stateMap[product.fields?.state ?? 'draft'] ?? 'draft'

		// Map product type
		const productType = (product.type ??
			'self-paced') as ProductStatus['productType']

		// Check enrollment window for cohorts
		const now = new Date()
		const enrollmentOpen = product.fields?.openEnrollment
		const enrollmentClose = product.fields?.closeEnrollment
		const withinEnrollmentWindow =
			(!enrollmentOpen || new Date(enrollmentOpen) <= now) &&
			(!enrollmentClose || new Date(enrollmentClose) >= now)

		// Product is available if: published, not sold out, and within enrollment window (if applicable)
		const available = state === 'active' && !soldOut && withinEnrollmentWindow

		return {
			productId: product.id,
			productType,
			available,
			soldOut,
			quantityAvailable,
			quantityRemaining,
			state,
			enrollmentOpen: enrollmentOpen ?? undefined,
			enrollmentClose: enrollmentClose ?? undefined,
		}
	},

	/**
	 * Search product content for agent recommendations
	 * Uses Typesense to find relevant courses, lessons, articles, etc.
	 */
	async searchContent(
		request: ContentSearchRequest,
	): Promise<ContentSearchResponse> {
		const { query, types, limit = 5 } = request

		// Check for Typesense configuration
		if (
			!process.env.TYPESENSE_WRITE_API_KEY ||
			!process.env.NEXT_PUBLIC_TYPESENSE_HOST
		) {
			console.error('Missing Typesense configuration for content search')
			return {
				results: [],
				quickLinks: getQuickLinks(),
			}
		}

		try {
			const typesenseClient = new Typesense.Client({
				nodes: [
					{
						host: process.env.NEXT_PUBLIC_TYPESENSE_HOST,
						port: 443,
						protocol: 'https',
					},
				],
				apiKey: process.env.TYPESENSE_WRITE_API_KEY,
				connectionTimeoutSeconds: 5,
			})

			// Build filter for content types and visibility
			const typeFilter = types?.length
				? `type:=[${types.join(',')}]`
				: 'type:=[post,tutorial,workshop,lesson,article]'
			const filterBy = `${typeFilter} && state:=published && visibility:=public`

			const searchResult = await typesenseClient
				.collections(TYPESENSE_COLLECTION_NAME)
				.documents()
				.search({
					q: query,
					query_by: 'title,description,summary,tags',
					filter_by: filterBy,
					per_page: limit,
					exclude_fields: 'embedding',
				})

			const results: ContentSearchResult[] = (searchResult.hits || []).map(
				(hit: any) => {
					const doc = hit.document
					const baseUrl = env.NEXT_PUBLIC_URL || 'https://www.aihero.dev'

					return {
						id: doc.id,
						type: mapTypesenseTypeToContentType(doc.type),
						title: doc.title,
						description: doc.summary || doc.description?.slice(0, 200),
						url: buildContentUrl(baseUrl, doc.type, doc.slug),
						score: hit.text_match_info?.score
							? hit.text_match_info.score / 100
							: undefined,
						metadata: {
							tags: doc.tags,
							updatedAt: doc.updated_at_timestamp
								? new Date(doc.updated_at_timestamp).toISOString()
								: undefined,
						},
					}
				},
			)

			return {
				results,
				quickLinks: getQuickLinks(),
				meta: {
					totalResults: searchResult.found,
					searchTimeMs: searchResult.search_time_ms,
				},
			}
		} catch (error) {
			console.error('Content search failed:', error)
			return {
				results: [],
				quickLinks: getQuickLinks(),
			}
		}
	},

	// ── SDK v0.5.0 Agent Intelligence Methods ────────────────────────

	/**
	 * Get currently active promotions and sales.
	 *
	 * Uses the adapter's getDefaultCoupon() to find the active site-wide sale.
	 * This queries for coupon.default === true, status === 1 (active sale),
	 * and not expired — the canonical way to find active promotions.
	 */
	async getActivePromotions(): Promise<Promotion[]> {
		const defaultCouponData = await courseBuilderAdapter.getDefaultCoupon()

		if (!defaultCouponData) return []

		const { defaultCoupon: c, defaultMerchantCoupon: mc } = defaultCouponData

		const pctDiscount = c.percentageDiscount ? Number(c.percentageDiscount) : 0
		const isPercent = pctDiscount > 0
		const discountAmount = isPercent
			? Math.round(pctDiscount * 100) // 0.30 → 30
			: (c.amountDiscount ?? 0) // already in cents

		return [
			{
				id: c.id,
				name:
					(c.fields as Record<string, any>)?.name ?? c.code ?? 'Promotion',
				code: c.code ?? undefined,
				discountType: isPercent ? ('percent' as const) : ('fixed' as const),
				discountAmount,
				validUntil: c.expires?.toISOString(),
				active: true,
				conditions: mapMerchantCouponType(mc.type),
			},
		]
	},

	/**
	 * Look up a coupon or discount code.
	 *
	 * Uses the adapter's couponForIdOrCode() which handles id-or-code lookup,
	 * validates expiry, and includes the linked MerchantCoupon for type info.
	 */
	async getCouponInfo(code: string): Promise<CouponInfo | null> {
		const couponData = await courseBuilderAdapter.couponForIdOrCode({ code })

		if (!couponData) return null

		const { merchantCoupon: mc, ...c } = couponData

		const isExhausted = c.maxUses !== -1 && c.usedCount >= c.maxUses

		const pctDiscount = c.percentageDiscount
			? Number(c.percentageDiscount)
			: 0
		const isPercent = pctDiscount > 0

		return {
			code: c.code ?? code,
			// couponForIdOrCode already filters out expired coupons,
			// so if we got a result, it's not expired. Check usage limits & status.
			valid: c.status === 1 && !isExhausted,
			discountType: isPercent ? 'percent' : 'fixed',
			discountAmount: isPercent
				? Math.round(pctDiscount * 100) // 0.30 → 30
				: (c.amountDiscount ?? 0),
			restrictionType: mapRestrictionType(mc.type),
			usageCount: c.usedCount,
			maxUses: c.maxUses === -1 ? undefined : c.maxUses,
			expiresAt: c.expires?.toISOString(),
		}
	},

	/**
	 * Get the app's refund policy configuration.
	 *
	 * Returns static config — AI Hero offers a 30-day refund window.
	 */
	async getRefundPolicy(): Promise<RefundPolicy> {
		return {
			autoApproveWindowDays: 30,
			manualApproveWindowDays: 60,
			noRefundAfterDays: 180,
			specialConditions: [
				'Lifetime access purchases: 30-day refund window',
				'Team/organization licenses: contact support for custom terms',
			],
			policyUrl: 'https://www.aihero.dev/refund-policy',
		}
	},

	/**
	 * Get granular content access for a user.
	 *
	 * Uses adapter helpers for entitlements, purchases, products, and memberships
	 * to determine what content the user can access and their team affiliation.
	 */
	async getContentAccess(userId: string): Promise<ContentAccess> {
		// Get user's active entitlements via adapter (handles deleted/expired filtering)
		const userEntitlements = await courseBuilderAdapter.getEntitlementsForUser({
			userId,
		})

		// Get user's purchases via adapter (includes product data)
		const userPurchases = await courseBuilderAdapter.getPurchasesForUser(userId)
		const activePurchases = userPurchases.filter(
			(p) => p.status === 'Valid' || p.status === 'Restricted',
		)

		// Build product access from active purchases using adapter for product details
		const productAccess: ContentAccess['products'] = []
		const seenProductIds = new Set<string>()

		for (const purchase of activePurchases) {
			if (seenProductIds.has(purchase.productId)) continue
			seenProductIds.add(purchase.productId)

			// Use adapter to get full product with resources
			const product = await courseBuilderAdapter.getProduct(purchase.productId)
			if (!product) continue

			// Use adapter to get product's linked content resources
			const productResources =
				(await courseBuilderAdapter.getProductResources(product.id)) ?? []

			const modules = productResources.map((r) => ({
				id: r.id,
				title:
					(r.fields as Record<string, any>)?.title ?? r.type ?? 'Unknown',
				accessible: true,
			}))

			// Check if any entitlement for this product has expired
			const relevantEntitlement = userEntitlements.find(
				(e) => e.sourceId === product.id,
			)
			const expiresAt = relevantEntitlement?.expiresAt

			const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false

			productAccess.push({
				productId: product.id,
				productName: product.name,
				accessLevel: isExpired ? 'expired' : 'full',
				modules: modules.length > 0 ? modules : undefined,
				expiresAt: expiresAt
					? new Date(expiresAt).toISOString()
					: undefined,
			})
		}

		// Get team membership via adapter's getMembershipsForUser
		// (includes organization and user data via relations)
		let teamMembership: ContentAccess['teamMembership'] = undefined

		const memberships =
			await courseBuilderAdapter.getMembershipsForUser(userId)
		const membership = memberships[0]

		if (membership?.organizationId) {
			const roleMap: Record<string, 'member' | 'admin' | 'owner'> = {
				owner: 'owner',
				admin: 'admin',
				user: 'member',
			}

			teamMembership = {
				teamId: membership.organizationId,
				teamName: membership.organization?.name ?? 'Organization',
				role: roleMap[membership.role] ?? 'member',
				seatClaimedAt:
					membership.createdAt?.toISOString() ?? new Date().toISOString(),
			}
		}

		return {
			userId,
			products: productAccess,
			teamMembership,
		}
	},

	/**
	 * Get recent user activity and progress.
	 *
	 * Uses the adapter's getLessonProgressForUser() to get ResourceProgress[],
	 * then computes counts and recent items from the result.
	 * For recent item titles, fetches content resources via adapter.
	 */
	async getRecentActivity(userId: string): Promise<UserActivity> {
		const progress =
			(await courseBuilderAdapter.getLessonProgressForUser(userId)) ?? []

		// Compute counts from the progress array
		const totalCount = progress.length
		const completedItems = progress.filter((p) => p.completedAt !== null)
		const completedCount = completedItems.length

		// Sort by completedAt descending for recent items
		const sortedCompleted = [...completedItems].sort((a, b) => {
			const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0
			const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0
			return dateB - dateA
		})

		// Build recent items with titles from content resources
		const recentItems: UserActivity['recentItems'] = []
		for (const item of sortedCompleted.slice(0, 10)) {
			let title = 'Unknown resource'
			if (item.resourceId) {
				const resource = await courseBuilderAdapter.getContentResource(
					item.resourceId,
				)
				if (resource) {
					title =
						(resource.fields as Record<string, any>)?.title ??
						resource.type ??
						'Unknown resource'
				}
			}
			recentItems.push({
				type: 'lesson_completed' as const,
				title,
				timestamp: item.completedAt!.toISOString(),
			})
		}

		// Determine last active timestamp from most recently completed item
		const lastActiveAt = sortedCompleted[0]?.completedAt?.toISOString()

		return {
			userId,
			lastActiveAt,
			lessonsCompleted: completedCount,
			totalLessons: totalCount,
			completionPercent:
				totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
			recentItems,
		}
	},

	/**
	 * Get team license and seat information for a purchase.
	 *
	 * Uses adapter helpers for purchase, organization, and member lookups.
	 * AI Hero uses Organization-based teams (not bulkCoupon).
	 */
	async getLicenseInfo(purchaseId: string): Promise<LicenseInfo | null> {
		// Get the purchase via adapter
		const purchase = await courseBuilderAdapter.getPurchase(purchaseId)
		if (!purchase) return null

		// Check if this purchase is associated with an organization
		const orgId = (purchase as any).organizationId
		if (!orgId) {
			// Individual purchase — no team license
			return {
				purchaseId,
				licenseType: 'individual',
				totalSeats: 1,
				claimedSeats: 1,
				availableSeats: 0,
				claimedBy: [],
			}
		}

		// Get organization details via adapter
		let org: { id: string; name: string | null; fields: Record<string, any> } | null = null
		try {
			org = await courseBuilderAdapter.getOrganization(orgId)
		} catch {
			// Organization not found
			return null
		}
		if (!org) return null

		// Get organization members via adapter's getMembershipsForUser won't work here
		// (we need all members of an org, not memberships for a single user).
		// Use getOrganizationMembers which returns OrganizationMember[] with user data.
		const members = await courseBuilderAdapter.getOrganizationMembers(orgId)

		// Determine total seats from org fields or purchase quantity
		const orgFields = org.fields as Record<string, any> | null
		const totalSeats =
			orgFields?.maxSeats ?? orgFields?.seats ?? members.length

		// Find the admin (owner role) — members include user relation
		const admin = members.find((m) => m.role === 'owner')

		// Determine license type based on seat count
		let licenseType: LicenseInfo['licenseType'] = 'team'
		if (totalSeats === 1) licenseType = 'individual'
		else if (totalSeats > 50) licenseType = 'enterprise'

		return {
			purchaseId,
			licenseType,
			totalSeats,
			claimedSeats: members.length,
			availableSeats: Math.max(0, totalSeats - members.length),
			claimedBy: members.map((m) => ({
				email: m.user?.email ?? 'unknown',
				claimedAt:
					m.createdAt?.toISOString() ?? new Date().toISOString(),
			})),
			adminEmail: admin?.user?.email ?? undefined,
		}
	},

	/**
	 * Get app metadata.
	 *
	 * Returns static configuration for AI Hero.
	 */
	async getAppInfo(): Promise<AppInfo> {
		return {
			name: 'AI Hero',
			instructorName: 'Matt Pocock',
			supportEmail: 'team@aihero.dev',
			websiteUrl: env.NEXT_PUBLIC_URL || 'https://www.aihero.dev',
			invoicesUrl: `${env.NEXT_PUBLIC_URL || 'https://www.aihero.dev'}/invoices`,
			discordUrl: 'https://aihero.dev/discord',
			refundPolicyUrl: 'https://www.aihero.dev/refund-policy',
			privacyPolicyUrl: 'https://www.aihero.dev/privacy',
			termsUrl: 'https://www.aihero.dev/terms',
		}
	},
}

/**
 * Map course-builder purchase status to SDK status
 */
function mapPurchaseStatus(
	status: string,
): 'active' | 'refunded' | 'transferred' {
	switch (status) {
		case 'Refunded':
			return 'refunded'
		case 'Transferred':
			return 'transferred'
		case 'Valid':
		default:
			return 'active'
	}
}

/**
 * Map MerchantCoupon type to human-readable conditions
 */
function mapMerchantCouponType(type: string | null): string | undefined {
	if (!type) return undefined
	switch (type) {
		case 'ppp':
			return 'PPP — purchasing power parity discount'
		case 'bulk':
			return 'Bulk/team discount'
		case 'special':
			return 'Special promotion'
		default:
			return type
	}
}

/**
 * Map MerchantCoupon type to SDK restriction type
 */
function mapRestrictionType(
	type: string | null,
): CouponInfo['restrictionType'] {
	if (!type) return 'general'
	switch (type) {
		case 'ppp':
			return 'ppp'
		case 'bulk':
			return 'bulk'
		default:
			return 'general'
	}
}

/**
 * Map Typesense content type to SDK content type
 */
function mapTypesenseTypeToContentType(
	type: string,
): ContentSearchResult['type'] {
	switch (type) {
		case 'tutorial':
		case 'workshop':
			return 'course'
		case 'lesson':
			return 'lesson'
		case 'post':
		case 'article':
			return 'article'
		case 'list':
			return 'resource'
		default:
			return 'article'
	}
}

/**
 * Build URL for content based on type and slug
 */
function buildContentUrl(baseUrl: string, type: string, slug: string): string {
	switch (type) {
		case 'tutorial':
			return `${baseUrl}/tutorials/${slug}`
		case 'workshop':
			return `${baseUrl}/workshops/${slug}`
		case 'lesson':
			return `${baseUrl}/lessons/${slug}`
		case 'post':
		case 'article':
			return `${baseUrl}/posts/${slug}`
		case 'list':
			return `${baseUrl}/lists/${slug}`
		default:
			return `${baseUrl}/${slug}`
	}
}

/**
 * Static quick links for AI Hero
 */
function getQuickLinks(): ContentSearchResult[] {
	return [
		{
			id: 'quick-discord',
			type: 'social',
			title: 'AI Hero Discord',
			url: 'https://aihero.dev/discord',
		},
		{
			id: 'quick-twitter',
			type: 'social',
			title: 'Matt Pocock on Twitter',
			url: 'https://x.com/mattpocockuk',
		},
		{
			id: 'quick-support',
			type: 'resource',
			title: 'Contact Support',
			url: 'mailto:team@aihero.dev',
		},
	]
}
