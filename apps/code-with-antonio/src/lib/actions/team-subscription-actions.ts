'use server'

import { revalidatePath } from 'next/cache'
import { emailProvider } from '@/coursebuilder/email-provider'
import { stripeProvider } from '@/coursebuilder/stripe-provider'
import { courseBuilderAdapter, db } from '@/db'
import {
	entitlements,
	organizationMemberships,
	subscription as subscriptionTable,
} from '@/db/schema'
import TeamSubscriptionInviteEmail from '@/emails/team-subscription-invite-email'
import { env } from '@/env.mjs'
import { createSubscriptionEntitlement } from '@/lib/entitlements'
import {
	getSubscriptionFields,
	hasUserClaimedSeat,
} from '@/lib/team-subscriptions'
import { authOptions, getServerAuthSession } from '@/server/auth'
import { Theme } from '@auth/core/types'
import { render } from '@react-email/render'
import { and, eq, isNull } from 'drizzle-orm'

import { sendServerEmail } from '@coursebuilder/core/lib/send-server-email'

/**
 * Gets the current period end date from a subscription's Stripe data.
 * Returns undefined if unable to fetch.
 */
async function getSubscriptionExpiresAt(
	stripeSubscriptionId: string | null | undefined,
): Promise<Date | undefined> {
	if (!stripeSubscriptionId) return undefined

	try {
		const stripeSubscription =
			await stripeProvider.getSubscription(stripeSubscriptionId)
		return stripeSubscription.current_period_end
			? new Date(stripeSubscription.current_period_end * 1000)
			: undefined
	} catch (error) {
		console.error('Error fetching Stripe subscription:', error)
		return undefined
	}
}

/**
 * Result type for team subscription actions.
 */
export type TeamActionResult = {
	success: boolean
	error?: string
}

/**
 * Owner claims a subscription seat for themselves.
 * Creates an entitlement for the owner, using one of the available seats.
 *
 * @param subscriptionId - The subscription to claim a seat on
 * @returns Result indicating success or failure with error message
 */
export async function claimSubscriptionSeat({
	subscriptionId,
}: {
	subscriptionId: string
}): Promise<TeamActionResult> {
	try {
		const { session } = await getServerAuthSession()
		if (!session?.user?.id) {
			return { success: false, error: 'Not authenticated' }
		}

		const userId = session.user.id

		// Load subscription and verify ownership
		const subscription = await db.query.subscription.findFirst({
			where: eq(subscriptionTable.id, subscriptionId),
			with: { product: true, merchantSubscription: true },
		})

		if (!subscription) {
			return { success: false, error: 'Subscription not found' }
		}

		const fields = await getSubscriptionFields(subscriptionId)
		if (!fields) {
			return { success: false, error: 'Invalid subscription configuration' }
		}

		// Verify user is the owner
		if (fields.ownerId !== userId) {
			return {
				success: false,
				error: 'Only the subscription owner can claim seats',
			}
		}

		// Check if user already has a seat
		const alreadyClaimed = await hasUserClaimedSeat(subscriptionId, userId)
		if (alreadyClaimed) {
			return { success: false, error: 'You have already claimed a seat' }
		}

		// Count current entitlements to check seat availability
		const currentEntitlements = await db.query.entitlements.findMany({
			where: and(
				eq(entitlements.sourceId, subscriptionId),
				eq(entitlements.sourceType, 'SUBSCRIPTION'),
				isNull(entitlements.deletedAt),
			),
		})

		if (currentEntitlements.length >= fields.seats) {
			return { success: false, error: 'No seats available' }
		}

		// Get user's organization membership
		const userMemberships =
			await courseBuilderAdapter.getMembershipsForUser(userId)
		const orgMembership = userMemberships.find(
			(m) => m.organizationId === subscription.organizationId,
		)

		if (!orgMembership) {
			return {
				success: false,
				error: 'User is not a member of the subscription organization',
			}
		}

		// Get entitlement type
		const subscriptionEntitlementType =
			await courseBuilderAdapter.getEntitlementTypeByName('subscription_access')

		if (!subscriptionEntitlementType) {
			return { success: false, error: 'Entitlement type not configured' }
		}

		// Get product tier
		const tier = subscription.product?.fields?.tier || 'standard'

		// Get expiration from Stripe subscription
		const expiresAt = await getSubscriptionExpiresAt(
			subscription.merchantSubscription?.identifier,
		)

		// Create the entitlement
		await createSubscriptionEntitlement({
			userId,
			subscriptionId,
			productId: subscription.productId,
			organizationId: subscription.organizationId!,
			organizationMembershipId: orgMembership.id,
			entitlementType: subscriptionEntitlementType.id,
			expiresAt,
			metadata: { tier },
		})

		revalidatePath('/team')
		return { success: true }
	} catch (error) {
		console.error('Error claiming subscription seat:', error)
		return {
			success: false,
			error: 'An unexpected error occurred. Please try again.',
		}
	}
}

/**
 * Invite a team member to a subscription by email.
 * Creates an entitlement for the invited user when they accept.
 *
 * For now, this directly creates an entitlement if the user exists.
 * TODO: Implement proper invitation flow with email notification.
 *
 * @param subscriptionId - The subscription to invite to
 * @param email - Email of the user to invite
 * @returns Result indicating success or failure
 */
export async function inviteToSubscription({
	subscriptionId,
	email,
}: {
	subscriptionId: string
	email: string
}): Promise<TeamActionResult> {
	try {
		const { session } = await getServerAuthSession()
		if (!session?.user?.id) {
			return { success: false, error: 'Not authenticated' }
		}

		const ownerId = session.user.id

		// Load subscription
		const subscription = await db.query.subscription.findFirst({
			where: eq(subscriptionTable.id, subscriptionId),
			with: { product: true, merchantSubscription: true },
		})

		if (!subscription) {
			return { success: false, error: 'Subscription not found' }
		}

		const fields = await getSubscriptionFields(subscriptionId)
		if (!fields) {
			return { success: false, error: 'Invalid subscription configuration' }
		}

		// Verify caller is owner
		if (fields.ownerId !== ownerId) {
			return {
				success: false,
				error: 'Only the subscription owner can invite members',
			}
		}

		// Check seat availability
		const currentEntitlements = await db.query.entitlements.findMany({
			where: and(
				eq(entitlements.sourceId, subscriptionId),
				eq(entitlements.sourceType, 'SUBSCRIPTION'),
				isNull(entitlements.deletedAt),
			),
		})

		if (currentEntitlements.length >= fields.seats) {
			return { success: false, error: 'No seats available' }
		}

		// Find or create user
		const { user: invitedUser } =
			await courseBuilderAdapter.findOrCreateUser(email)

		// Check if user already has a seat
		const alreadyClaimed = await hasUserClaimedSeat(
			subscriptionId,
			invitedUser.id,
		)
		if (alreadyClaimed) {
			return { success: false, error: 'This user already has a seat' }
		}

		// Ensure user has membership in the organization
		let orgMembership = (
			await courseBuilderAdapter.getMembershipsForUser(invitedUser.id)
		).find((m) => m.organizationId === subscription.organizationId)

		if (!orgMembership) {
			// Add user to organization
			await db.insert(organizationMemberships).values({
				id: crypto.randomUUID(),
				userId: invitedUser.id,
				organizationId: subscription.organizationId!,
				invitedById: ownerId,
			})

			// Refetch membership
			orgMembership = (
				await courseBuilderAdapter.getMembershipsForUser(invitedUser.id)
			).find((m) => m.organizationId === subscription.organizationId)
		}

		if (!orgMembership) {
			return { success: false, error: 'Failed to add user to organization' }
		}

		// Get entitlement type
		const subscriptionEntitlementType =
			await courseBuilderAdapter.getEntitlementTypeByName('subscription_access')

		if (!subscriptionEntitlementType) {
			return { success: false, error: 'Entitlement type not configured' }
		}

		// Get product tier
		const tier = subscription.product?.fields?.tier || 'standard'

		// Get expiration from Stripe subscription
		const expiresAt = await getSubscriptionExpiresAt(
			subscription.merchantSubscription?.identifier,
		)

		// Create entitlement for invited user
		await createSubscriptionEntitlement({
			userId: invitedUser.id,
			subscriptionId,
			productId: subscription.productId,
			organizationId: subscription.organizationId!,
			organizationMembershipId: orgMembership.id,
			entitlementType: subscriptionEntitlementType.id,
			expiresAt,
			metadata: { tier, invitedBy: ownerId },
		})

		// Get product info for the email
		const productTitle =
			subscription.product?.name ||
			subscription.product?.fields?.title ||
			env.NEXT_PUBLIC_SITE_TITLE ||
			'Subscription'
		const inviterName = session.user.name || undefined

		// Send invitation email with magic login link
		try {
			await sendServerEmail({
				email,
				callbackUrl: env.COURSEBUILDER_URL,
				baseUrl: env.COURSEBUILDER_URL,
				authOptions,
				type: 'login',
				html: createInviteEmailHtml(productTitle, inviterName),
				text: createInviteEmailText(productTitle, inviterName),
				adapter: courseBuilderAdapter,
				emailProvider,
			})
		} catch (emailError) {
			// Log but don't fail the invite if email fails
			console.error('Failed to send invitation email:', emailError)
		}

		revalidatePath('/team')
		return { success: true }
	} catch (error) {
		console.error('Error inviting to subscription:', error)
		return {
			success: false,
			error: 'An unexpected error occurred. Please try again.',
		}
	}
}

/**
 * Remove a team member from a subscription.
 * Soft-deletes their entitlement, freeing up the seat.
 *
 * @param subscriptionId - The subscription to remove from
 * @param userId - The user ID to remove
 * @returns Result indicating success or failure
 */
export async function removeFromSubscription({
	subscriptionId,
	userId,
}: {
	subscriptionId: string
	userId: string
}): Promise<TeamActionResult> {
	try {
		const { session } = await getServerAuthSession()
		if (!session?.user?.id) {
			return { success: false, error: 'Not authenticated' }
		}

		const ownerId = session.user.id

		// Load subscription
		const subscription = await db.query.subscription.findFirst({
			where: eq(subscriptionTable.id, subscriptionId),
		})

		if (!subscription) {
			return { success: false, error: 'Subscription not found' }
		}

		const fields = await getSubscriptionFields(subscriptionId)
		if (!fields) {
			return { success: false, error: 'Invalid subscription configuration' }
		}

		// Verify caller is owner
		if (fields.ownerId !== ownerId) {
			return {
				success: false,
				error: 'Only the subscription owner can remove members',
			}
		}

		// Prevent owner from removing themselves
		if (userId === ownerId) {
			return {
				success: false,
				error: 'The subscription owner cannot remove themselves',
			}
		}

		// Find and soft-delete the entitlement
		await db
			.update(entitlements)
			.set({
				deletedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(
				and(
					eq(entitlements.sourceId, subscriptionId),
					eq(entitlements.sourceType, 'SUBSCRIPTION'),
					eq(entitlements.userId, userId),
					isNull(entitlements.deletedAt),
				),
			)

		revalidatePath('/team')
		return { success: true }
	} catch (error) {
		console.error('Error removing from subscription:', error)
		return {
			success: false,
			error: 'An unexpected error occurred. Please try again.',
		}
	}
}

/**
 * Add more seats to an existing subscription.
 * Updates the Stripe subscription quantity and syncs to local database.
 * Stripe will handle proration automatically.
 *
 * @param subscriptionId - The subscription to add seats to
 * @param additionalSeats - Number of seats to add
 * @returns Result indicating success or failure
 */
export async function addSeatsToSubscription({
	subscriptionId,
	additionalSeats,
}: {
	subscriptionId: string
	additionalSeats: number
}): Promise<TeamActionResult> {
	try {
		const { session } = await getServerAuthSession()
		if (!session?.user?.id) {
			return { success: false, error: 'Not authenticated' }
		}

		const ownerId = session.user.id

		if (additionalSeats < 1) {
			return { success: false, error: 'Must add at least 1 seat' }
		}

		// Load subscription with merchant subscription
		const subscription = await db.query.subscription.findFirst({
			where: eq(subscriptionTable.id, subscriptionId),
			with: {
				merchantSubscription: true,
			},
		})

		if (!subscription) {
			return { success: false, error: 'Subscription not found' }
		}

		const fields = await getSubscriptionFields(subscriptionId)
		if (!fields) {
			return { success: false, error: 'Invalid subscription configuration' }
		}

		// Verify caller is owner
		if (fields.ownerId !== ownerId) {
			return {
				success: false,
				error: 'Only the subscription owner can add seats',
			}
		}

		// Get the Stripe subscription ID from merchant subscription
		const stripeSubscriptionId = subscription.merchantSubscription?.identifier
		if (!stripeSubscriptionId) {
			return { success: false, error: 'Stripe subscription not found' }
		}

		// Get current subscription to determine new quantity
		const stripeSubscription =
			await stripeProvider.getSubscription(stripeSubscriptionId)
		const currentQuantity = stripeSubscription.items.data[0]?.quantity || 1
		const newQuantity = currentQuantity + additionalSeats

		// Update Stripe - this will trigger a webhook that updates our local DB
		const adapter = stripeProvider.options.paymentsAdapter
		await adapter.updateSubscriptionItemQuantity(
			stripeSubscriptionId,
			newQuantity,
		)

		// Also update local DB immediately for better UX
		// (webhook will also update, but this provides instant feedback)
		// IMPORTANT: Preserve existing fields (especially ownerId) when updating
		const currentFields = (subscription.fields as Record<string, unknown>) || {}

		// Verify we have ownerId before updating - defensive check
		if (!currentFields.ownerId) {
			console.error(
				`Subscription ${subscriptionId} is missing ownerId in fields!`,
				{ currentFields },
			)
			// Re-add ownerId from the verified owner
			currentFields.ownerId = ownerId
		}

		const updatedFields = {
			...currentFields,
			seats: newQuantity,
		}

		console.log(`Updating subscription ${subscriptionId} fields:`, {
			before: currentFields,
			after: updatedFields,
		})

		await db
			.update(subscriptionTable)
			.set({
				fields: updatedFields,
			})
			.where(eq(subscriptionTable.id, subscriptionId))

		revalidatePath('/team')
		return { success: true }
	} catch (error) {
		console.error('Error adding seats to subscription:', error)
		return {
			success: false,
			error: 'An unexpected error occurred. Please try again.',
		}
	}
}

// ============================================================================
// Email template helpers for team subscription invitations
// ============================================================================

type HTMLEmailParams = Record<'url' | 'host' | 'email', string> & {
	expires?: Date
}

/**
 * Creates an HTML email renderer for team subscription invites.
 * Captures productTitle and inviterName in closure for use by sendServerEmail.
 */
function createInviteEmailHtml(productTitle: string, inviterName?: string) {
	return async function inviteEmailHtml(
		{ url, host, email }: HTMLEmailParams,
		_theme?: Theme,
	): Promise<string> {
		return await render(
			TeamSubscriptionInviteEmail({
				url,
				host,
				email,
				siteName: env.NEXT_PUBLIC_SITE_TITLE || '',
				productTitle,
				inviterName,
				previewText: `You've been invited to join ${productTitle}`,
			}),
		)
	}
}

/**
 * Creates a plain text email renderer for team subscription invites.
 * Used as fallback for email clients that don't render HTML.
 */
function createInviteEmailText(productTitle: string, inviterName?: string) {
	return async function inviteEmailText(
		{ url, host, email }: HTMLEmailParams,
		_theme?: Theme,
	): Promise<string> {
		return await render(
			TeamSubscriptionInviteEmail({
				url,
				host,
				email,
				siteName: env.NEXT_PUBLIC_SITE_TITLE || '',
				productTitle,
				inviterName,
				previewText: `You've been invited to join ${productTitle}`,
			}),
			{ plainText: true },
		)
	}
}
