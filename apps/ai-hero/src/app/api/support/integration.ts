import { courseBuilderAdapter } from '@/db'
import { env } from '@/env.mjs'
import { TYPESENSE_COLLECTION_NAME } from '@/utils/typesense-instantsearch-adapter'
import type {
	ActionResult,
	ContentSearchRequest,
	ContentSearchResponse,
	ContentSearchResult,
	Purchase,
	SupportIntegration,
	User,
} from '@skillrecordings/sdk/integration'
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

		return userPurchases.map((p) => ({
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
			title: 'AI Hero on Twitter',
			url: 'https://twitter.com/aaborisag',
		},
		{
			id: 'quick-support',
			type: 'resource',
			title: 'Contact Support',
			url: 'mailto:team@aihero.dev',
		},
	]
}
