import { log } from '@/server/logger'

import type { CourseBuilderAdapter } from '@coursebuilder/core/adapters'

/**
 * Result of personal organization operations
 */
export interface PersonalOrgResult {
	organization: any
	membership: any
	wasCreated: boolean
}

/**
 * Minimal user interface for personal org operations
 */
export interface PersonalOrgUser {
	id: string
	email: string
}

/**
 * Get the expected name for a user's personal organization
 */
export function getPersonalOrgName(userEmail: string): string {
	return `Personal (${userEmail})`
}

/**
 * Find an existing personal organization for a user
 * @param user - The user to find the organization for
 * @param adapter - The course builder adapter
 * @returns The organization and membership if found, null otherwise
 */
export async function getPersonalOrganization(
	user: PersonalOrgUser,
	adapter: CourseBuilderAdapter,
): Promise<{ organization: any; membership: any } | null> {
	if (!user.email) {
		throw new Error('User email is required to find personal organization')
	}

	const memberships = await adapter.getMembershipsForUser(user.id)
	const expectedOrgName = getPersonalOrgName(user.email)

	const personalMembership = memberships.find(
		(membership) => membership.organization.name === expectedOrgName,
	)

	if (personalMembership) {
		return {
			organization: personalMembership.organization,
			membership: personalMembership,
		}
	}

	// Fallback: if no exact match, return the first organization (should be personal)
	const firstMembership = memberships[0]
	if (firstMembership) {
		await log.warn('personal-org-name-mismatch', {
			userId: user.id,
			userEmail: user.email,
			expectedName: expectedOrgName,
			actualName: firstMembership.organization.name,
		})

		return {
			organization: firstMembership.organization,
			membership: firstMembership,
		}
	}

	return null
}

/**
 * Create a new personal organization for a user
 * @param user - The user to create the organization for
 * @param adapter - The course builder adapter
 * @returns The created organization and membership
 */
export async function createPersonalOrganization(
	user: PersonalOrgUser,
	adapter: CourseBuilderAdapter,
): Promise<{ organization: any; membership: any }> {
	if (!user.email) {
		throw new Error('User email is required to create personal organization')
	}

	await log.info('personal-org-create-start', {
		userId: user.id,
		userEmail: user.email,
	})

	// Create the organization
	const organization = await adapter.createOrganization({
		name: getPersonalOrgName(user.email),
	})

	if (!organization) {
		throw new Error('Failed to create personal organization')
	}

	// Add user as member
	const membership = await adapter.addMemberToOrganization({
		organizationId: organization.id,
		userId: user.id,
		invitedById: user.id,
	})

	if (!membership) {
		throw new Error('Failed to add user to personal organization')
	}

	// Add owner role
	await adapter.addRoleForMember({
		organizationId: organization.id,
		memberId: membership.id,
		role: 'owner',
	})

	await log.info('personal-org-created', {
		userId: user.id,
		organizationId: organization.id,
		membershipId: membership.id,
	})

	return { organization, membership }
}

/**
 * Ensure a user has a personal organization, creating one if it doesn't exist
 * @param user - The user to ensure has a personal organization
 * @param adapter - The course builder adapter
 * @returns The organization, membership, and whether it was created
 */
export async function ensurePersonalOrganization(
	user: PersonalOrgUser,
	adapter: CourseBuilderAdapter,
): Promise<PersonalOrgResult> {
	const existing = await getPersonalOrganization(user, adapter)

	if (existing) {
		return {
			organization: existing.organization,
			membership: existing.membership,
			wasCreated: false,
		}
	}

	const created = await createPersonalOrganization(user, adapter)
	return {
		organization: created.organization,
		membership: created.membership,
		wasCreated: true,
	}
}

/**
 * Ensure a user has a personal organization with learner role
 * @param user - The user to ensure has access
 * @param adapter - The course builder adapter
 * @returns The organization and membership with learner role ensured
 */
export async function ensurePersonalOrganizationWithLearnerRole(
	user: PersonalOrgUser,
	adapter: CourseBuilderAdapter,
): Promise<PersonalOrgResult> {
	const result = await ensurePersonalOrganization(user, adapter)

	// Ensure learner role exists
	try {
		await adapter.addRoleForMember({
			organizationId: result.organization.id,
			memberId: result.membership.id,
			role: 'learner',
		})
		await log.info('personal-org-learner-role-added', {
			userId: user.id,
			organizationId: result.organization.id,
		})
	} catch (error: any) {
		if (error.message?.includes('duplicate') || error.code === 'P2002') {
			await log.info('personal-org-learner-role-exists', {
				userId: user.id,
				organizationId: result.organization.id,
			})
		} else {
			await log.error('personal-org-learner-role-failed', {
				userId: user.id,
				organizationId: result.organization.id,
				error: error.message,
			})
			throw new Error(`Failed to add learner role: ${error.message}`)
		}
	}

	return result
}
