import { courseBuilderAdapter, db } from '@/db'
import {
	entitlements,
	subscription as subscriptionTable,
	users,
} from '@/db/schema'
import { and, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'

import {
	Product,
	productSchema,
} from '@coursebuilder/core/schemas/product-schema'
import {
	Subscription,
	SubscriptionSchema,
} from '@coursebuilder/core/schemas/subscription'

/**
 * Schema for subscription fields that include team information.
 * Used to validate and type the JSON fields stored on subscriptions.
 * Uses coerce for seats to handle JSON serialization (may store as string).
 */
export const TeamSubscriptionFieldsSchema = z.object({
	seats: z.coerce.number().min(1).default(1),
	ownerId: z.string(),
})

export type TeamSubscriptionFields = z.infer<
	typeof TeamSubscriptionFieldsSchema
>

/**
 * Represents a team member who has claimed a seat on a subscription.
 */
export type TeamMember = {
	userId: string
	email: string
	name: string | null
	joinedAt: Date
	entitlementId: string
}

/**
 * Seat allocation information for a team subscription.
 */
export type SeatInfo = {
	total: number
	used: number
	available: number
}

/**
 * Full team subscription data including members and seat info.
 */
export type TeamSubscription = {
	subscription: Subscription
	product: Product
	seats: SeatInfo
	members: TeamMember[]
	isOwner: boolean
	ownerId: string
}

/**
 * Gets all team subscriptions where the user is the owner.
 * Team subscriptions are subscriptions with seats > 1.
 *
 * @param userId - The user ID to get team subscriptions for
 * @returns Array of team subscriptions with member info
 */
export async function getTeamSubscriptionsForUser(
	userId: string,
): Promise<TeamSubscription[]> {
	// Get user's memberships to find their organizations
	const memberships = await courseBuilderAdapter.getMembershipsForUser(userId)

	const teamSubscriptions: TeamSubscription[] = []

	for (const membership of memberships) {
		if (!membership.organizationId) continue

		// Find subscriptions in this organization where user is owner
		const orgSubscriptions = await db.query.subscription.findMany({
			where: and(
				eq(subscriptionTable.organizationId, membership.organizationId),
				eq(subscriptionTable.status, 'active'),
			),
			with: {
				product: true,
				merchantSubscription: true,
			},
		})

		for (const sub of orgSubscriptions) {
			// Parse fields to check if this is a team subscription owned by this user
			const fieldsParsed = TeamSubscriptionFieldsSchema.safeParse(sub.fields)

			if (!fieldsParsed.success) {
				console.warn(
					`Subscription ${sub.id} has invalid fields:`,
					sub.fields,
					fieldsParsed.error.errors,
				)
				continue
			}

			const fields = fieldsParsed.data

			// Only include team subscriptions (seats > 1) where user is owner
			if (fields.seats <= 1 || fields.ownerId !== userId) continue

			// Get all members (entitlements) for this subscription
			const memberEntitlements = await db.query.entitlements.findMany({
				where: and(
					eq(entitlements.sourceId, sub.id),
					eq(entitlements.sourceType, 'SUBSCRIPTION'),
					isNull(entitlements.deletedAt),
				),
			})

			// Get user details for each entitlement
			const members: TeamMember[] = []
			for (const ent of memberEntitlements) {
				if (!ent.userId) continue
				const user = await db.query.users.findFirst({
					where: eq(users.id, ent.userId),
				})

				if (user) {
					members.push({
						userId: user.id,
						email: user.email ?? '',
						name: user.name,
						joinedAt: ent.createdAt ?? new Date(),
						entitlementId: ent.id,
					})
				}
			}

			const seats: SeatInfo = {
				total: fields.seats,
				used: members.length,
				available: fields.seats - members.length,
			}

			// Parse subscription and product with error handling
			const parsedSubscription = SubscriptionSchema.safeParse(sub)
			const parsedProduct = productSchema.safeParse(sub.product)

			if (!parsedSubscription.success) {
				console.warn(
					`Failed to parse subscription ${sub.id}:`,
					parsedSubscription.error.errors,
				)
				continue
			}

			if (!parsedProduct.success) {
				console.warn(
					`Failed to parse product for subscription ${sub.id}:`,
					parsedProduct.error.errors,
				)
				continue
			}

			teamSubscriptions.push({
				subscription: parsedSubscription.data,
				product: parsedProduct.data,
				seats,
				members,
				isOwner: true,
				ownerId: fields.ownerId,
			})
		}
	}

	return teamSubscriptions
}

/**
 * Gets a specific team subscription by ID, including member information.
 * Validates that the requesting user is the owner.
 *
 * @param subscriptionId - The subscription ID
 * @param requestingUserId - The user requesting the data (must be owner)
 * @returns Team subscription data or null if not found/not owner
 */
export async function getTeamSubscription(
	subscriptionId: string,
	requestingUserId: string,
): Promise<TeamSubscription | null> {
	const sub = await db.query.subscription.findFirst({
		where: eq(subscriptionTable.id, subscriptionId),
		with: {
			product: true,
			merchantSubscription: true,
		},
	})

	if (!sub) return null

	const fieldsParsed = TeamSubscriptionFieldsSchema.safeParse(sub.fields)
	if (!fieldsParsed.success) return null

	const fields = fieldsParsed.data

	// Verify requesting user is the owner
	if (fields.ownerId !== requestingUserId) return null

	// Get members
	const memberEntitlements = await db.query.entitlements.findMany({
		where: and(
			eq(entitlements.sourceId, sub.id),
			eq(entitlements.sourceType, 'SUBSCRIPTION'),
			isNull(entitlements.deletedAt),
		),
	})

	const members: TeamMember[] = []
	for (const ent of memberEntitlements) {
		if (!ent.userId) continue
		const user = await db.query.users.findFirst({
			where: eq(users.id, ent.userId),
		})

		if (user) {
			members.push({
				userId: user.id,
				email: user.email ?? '',
				name: user.name,
				joinedAt: ent.createdAt ?? new Date(),
				entitlementId: ent.id,
			})
		}
	}

	const seats: SeatInfo = {
		total: fields.seats,
		used: members.length,
		available: fields.seats - members.length,
	}

	// Parse with error handling
	const parsedSubscription = SubscriptionSchema.safeParse(sub)
	const parsedProduct = productSchema.safeParse(sub.product)

	if (!parsedSubscription.success || !parsedProduct.success) {
		console.warn(`getTeamSubscription: Failed to parse data for ${sub.id}`, {
			subscriptionErrors: parsedSubscription.error?.errors,
			productErrors: parsedProduct.error?.errors,
		})
		return null
	}

	return {
		subscription: parsedSubscription.data,
		product: parsedProduct.data,
		seats,
		members,
		isOwner: true,
		ownerId: fields.ownerId,
	}
}

/**
 * Checks if a user has already claimed a seat on a subscription.
 *
 * @param subscriptionId - The subscription ID
 * @param userId - The user ID to check
 * @returns True if user has an active entitlement for this subscription
 */
export async function hasUserClaimedSeat(
	subscriptionId: string,
	userId: string,
): Promise<boolean> {
	const existingEntitlement = await db.query.entitlements.findFirst({
		where: and(
			eq(entitlements.sourceId, subscriptionId),
			eq(entitlements.sourceType, 'SUBSCRIPTION'),
			eq(entitlements.userId, userId),
			isNull(entitlements.deletedAt),
		),
	})

	return !!existingEntitlement
}

/**
 * Gets subscription fields parsed and validated.
 *
 * @param subscriptionId - The subscription ID
 * @returns Parsed fields or null if invalid
 */
export async function getSubscriptionFields(
	subscriptionId: string,
): Promise<TeamSubscriptionFields | null> {
	const sub = await db.query.subscription.findFirst({
		where: eq(subscriptionTable.id, subscriptionId),
	})

	if (!sub) return null

	const parsed = TeamSubscriptionFieldsSchema.safeParse(sub.fields)
	if (!parsed.success) {
		console.warn(
			`getSubscriptionFields: Failed to parse fields for ${subscriptionId}:`,
			{ fields: sub.fields, errors: parsed.error.errors },
		)
	}
	return parsed.success ? parsed.data : null
}
