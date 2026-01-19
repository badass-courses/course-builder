import { courseBuilderAdapter, db } from '@/db'
import {
	merchantCharge,
	products,
	purchases,
	purchaseUserTransfer,
	users,
} from '@/db/schema'
import { env } from '@/env.mjs'
import type {
	ActionResult,
	Purchase,
	SupportIntegration,
	User,
} from '@skillrecordings/sdk/integration'
import { and, eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

/**
 * Support Platform Integration for AI Hero
 *
 * Implements the SupportIntegration interface to allow the support agent
 * to look up users, purchases, and perform actions like refunds and transfers.
 */
export const integration: SupportIntegration = {
	/**
	 * Look up user by email address
	 */
	async lookupUser(email: string): Promise<User | null> {
		const user = await db.query.users.findFirst({
			where: eq(users.email, email),
		})

		if (!user) return null

		return {
			id: user.id,
			email: user.email,
			name: user.name ?? undefined,
			createdAt: user.createdAt ?? new Date(),
		}
	},

	/**
	 * Get all purchases for a user
	 */
	async getPurchases(userId: string): Promise<Purchase[]> {
		const userPurchases = await db.query.purchases.findMany({
			where: eq(purchases.userId, userId),
			with: {
				product: true,
				merchantCharge: true,
			},
		})

		return userPurchases.map((p) => ({
			id: p.id,
			productId: p.productId,
			productName: p.product?.name ?? 'Unknown Product',
			purchasedAt: p.createdAt,
			amount: Math.round(parseFloat(p.totalAmount) * 100), // Convert to cents
			currency: 'USD',
			stripeChargeId: p.merchantCharge?.identifier ?? undefined,
			status: mapPurchaseStatus(p.status),
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
			await db
				.update(purchases)
				.set({
					status: 'Refunded',
					fields: {
						refundReason: reason,
						stripeRefundId: refundId,
						refundedAt: new Date().toISOString(),
					},
				})
				.where(eq(purchases.id, purchaseId))

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
			// Find or create the target user
			let toUser = await db.query.users.findFirst({
				where: eq(users.email, toEmail),
			})

			if (!toUser) {
				// Create user via adapter to ensure proper setup
				const newUser = await courseBuilderAdapter.createUser?.({
					email: toEmail,
					emailVerified: null,
				})
				if (!newUser) {
					return { success: false, error: 'Failed to create user' }
				}
				toUser = newUser as typeof toUser
			}

			// Record the transfer
			await db.insert(purchaseUserTransfer).values({
				id: uuidv4(),
				purchaseId,
				sourceUserId: fromUserId,
				targetUserId: toUser.id,
				transferState: 'COMPLETED',
				createdAt: new Date(),
				completedAt: new Date(),
			})

			// Update purchase ownership
			await db
				.update(purchases)
				.set({
					userId: toUser.id,
					status: 'Transferred',
				})
				.where(eq(purchases.id, purchaseId))

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
			const existing = await db.query.users.findFirst({
				where: eq(users.email, newEmail),
			})

			if (existing && existing.id !== userId) {
				return { success: false, error: 'Email already in use' }
			}

			await db
				.update(users)
				.set({ email: newEmail })
				.where(eq(users.id, userId))

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
			await db.update(users).set({ name: newName }).where(eq(users.id, userId))

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
