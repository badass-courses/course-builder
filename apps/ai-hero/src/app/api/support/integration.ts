import { courseBuilderAdapter } from '@/db'
import { env } from '@/env.mjs'
import type {
	ActionResult,
	Purchase,
	SupportIntegration,
	User,
} from '@skillrecordings/sdk/integration'
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
