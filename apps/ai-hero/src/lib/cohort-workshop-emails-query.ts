'use server'

import { db } from '@/db'
import {
	entitlements,
	entitlementTypes,
	organizationMemberships,
	users,
} from '@/db/schema'
import { Email } from '@/lib/emails'
import { getEmail } from '@/lib/emails-query'
import { getProduct, getProducts } from '@/lib/products-query'
import { Workshop } from '@/lib/workshops'
import { and, eq, gt, inArray, isNull, or, sql } from 'drizzle-orm'

import type { Product } from '@coursebuilder/core/schemas'

// Define a simple user type for our email purposes
export type EmailUser = {
	id: string
	email: string
	name?: string | null
}

// Reuse existing queries with filters
export async function getCohortProducts(): Promise<Product[]> {
	const products = await getProducts()
	return products.filter((product) =>
		product.resources?.some((r) => r.resource?.type === 'cohort'),
	)
}

export async function getUsersEntitledToWorkshops(
	workshopIds: string[],
): Promise<EmailUser[]> {
	if (workshopIds.length === 0) return []

	// Get the cohort content access entitlement type
	const cohortEntitlementType = await db.query.entitlementTypes.findFirst({
		where: eq(entitlementTypes.name, 'cohort_content_access'),
	})

	if (!cohortEntitlementType) {
		console.warn('cohort_content_access entitlement type not found')
		return []
	}

	// Find all active entitlements that grant access to any of these workshops
	const activeEntitlements = await db.query.entitlements.findMany({
		where: and(
			eq(entitlements.entitlementType, cohortEntitlementType.id),
			or(
				isNull(entitlements.expiresAt),
				gt(entitlements.expiresAt, sql`CURRENT_TIMESTAMP`),
			),
			isNull(entitlements.deletedAt),
		),
	})

	// Filter entitlements that have access to any of our workshop IDs
	const relevantEntitlements = activeEntitlements.filter((entitlement) => {
		const contentIds = entitlement.metadata?.contentIds || []
		return workshopIds.some((workshopId) => contentIds.includes(workshopId))
	})

	// Get unique organization membership IDs, filtering out nulls
	const membershipIds = [
		...new Set(
			relevantEntitlements
				.map((e) => e.organizationMembershipId)
				.filter((id): id is string => Boolean(id)),
		),
	]

	if (membershipIds.length === 0) return []

	// Get users through organization memberships
	const memberships = await db.query.organizationMemberships.findMany({
		where: inArray(organizationMemberships.id, membershipIds),
	})

	// Get user IDs, filtering out nulls
	const userIds = [
		...new Set(
			memberships
				.map((m) => m.userId)
				.filter((id): id is string => Boolean(id)),
		),
	]

	if (userIds.length === 0) return []

	// Get the actual user records
	const usersData = await db.query.users.findMany({
		where: inArray(users.id, userIds),
		columns: {
			id: true,
			email: true,
			name: true,
		},
	})

	return usersData.map((user) => ({
		id: user.id,
		email: user.email,
		name: user.name,
	}))
}

export async function getWorkshopsStartingToday(
	workshops: Workshop[],
	timezone: string = 'America/Los_Angeles',
): Promise<Workshop[]> {
	// Get current date in PT timezone
	const now = new Date()
	const ptDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
	const today = ptDate.toISOString().split('T')[0]

	return workshops.filter((workshop) => {
		if (!workshop.fields.startsAt) return false

		// Convert workshop start date to PT and compare
		const workshopStart = new Date(workshop.fields.startsAt)
		const workshopPTDate = new Date(
			workshopStart.toLocaleString('en-US', { timeZone: timezone }),
		)
		const workshopDate = workshopPTDate.toISOString().split('T')[0]

		return workshopDate === today
	})
}

export async function getWorkshopEmails(workshop: Workshop): Promise<Email[]> {
	const emailResources =
		workshop.resources?.filter((r) => r.resource.type === 'email') || []

	const emails = await Promise.all(
		emailResources.map((r) => getEmail(r.resourceId)),
	)

	return emails.filter(Boolean) as Email[]
}
