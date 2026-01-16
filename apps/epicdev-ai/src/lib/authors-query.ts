'use server'

import crypto from 'node:crypto'
import { revalidateTag } from 'next/cache'
import { User } from '@/ability'
import { db } from '@/db'
import {
	contentResource,
	contentResourceAuthor,
	roles,
	userRoles,
	users,
} from '@/db/schema'
import {
	AUTHOR_ROLE_ASSIGNMENT_COMPLETED_EVENT,
	AUTHOR_ROLE_ASSIGNMENT_FAILED_EVENT,
} from '@/inngest/events/author-role-assignment'
import { inngest } from '@/inngest/inngest.server'
import { log } from '@/server/logger'
import { and, eq, isNull } from 'drizzle-orm'

/**
 * Find or create a user by email, then assign author role.
 * This function handles user lookup/creation and role assignment.
 * @param email - User email address
 * @param name - User name (optional)
 * @returns The user with author role assigned
 */
export async function findOrCreateUserAndAssignAuthorRole(
	email: string,
	name?: string,
): Promise<User> {
	await log.info('author.assignment.start', {
		email,
		name,
	})

	try {
		// Step 1: Check if user exists by email
		const existingUser = await db.query.users.findFirst({
			where: eq(users.email, email),
		})

		let userId: string
		let wasCreated = false

		if (existingUser) {
			userId = existingUser.id
			await log.info('author.assignment.user-found', {
				userId,
				email,
			})
		} else {
			// Step 2: Create new user if doesn't exist
			// Just create the user record - the user/created event will handle
			// role assignment and organization setup
			userId = crypto.randomUUID()

			await db.insert(users).values({
				id: userId,
				email,
				name: name || null,
				emailVerified: null,
				image: null,
				role: 'user',
			})

			wasCreated = true
			await log.info('author.assignment.user-created', {
				userId,
				email,
				name,
			})

			// Send user created event to trigger user setup workflows
			// This will handle role assignment and organization creation
			await inngest.send({
				name: 'user/created',
				user: {
					id: userId,
					email,
					name: name || null,
				},
				data: {},
			})
		}

		// Step 3: Assign author role (this function handles checking if role already exists)
		const author = await createAuthor(userId)

		await log.info('author.assignment.completed', {
			userId,
			email,
			name,
			wasCreated,
		})

		// Send single event to Inngest for logging/monitoring (includes all info)
		await inngest.send({
			name: AUTHOR_ROLE_ASSIGNMENT_COMPLETED_EVENT,
			data: {
				userId,
				email,
				name,
				wasCreated,
				timestamp: new Date().toISOString(),
			},
		})

		return author
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error)

		await log.error('author.assignment.failed', {
			email,
			name,
			error: errorMessage,
		})

		// Send failure event to Inngest
		await inngest.send({
			name: AUTHOR_ROLE_ASSIGNMENT_FAILED_EVENT,
			data: {
				email,
				name,
				error: errorMessage,
				timestamp: new Date().toISOString(),
			},
		})

		throw error
	}
}

/**
 * Get all users with the "author" role.
 * @returns Array of users who have the author role
 */
export async function getAuthors(): Promise<User[]> {
	// Get users with "author" role from the roles system
	const authorsFromRoles = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			image: users.image,
			role: users.role,
		})
		.from(users)
		.innerJoin(userRoles, eq(users.id, userRoles.userId))
		.innerJoin(roles, eq(userRoles.roleId, roles.id))
		.where(and(eq(roles.name, 'author'), isNull(userRoles.deletedAt)))

	// Transform to match User type
	return authorsFromRoles.map((author) => ({
		...author,
		role: (author.role as 'admin' | 'user' | 'contributor') || 'user',
		memberships: [],
		roles: [{ name: 'author' }],
		organizationRoles: [],
		fields: {},
		entitlements: [],
	}))
}

/**
 * Get a single author by user ID.
 * @param userId - The user ID to look up
 * @returns The user if they have the author role, null otherwise
 */
export async function getAuthor(userId: string): Promise<User | null> {
	const author = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			image: users.image,
			role: users.role,
		})
		.from(users)
		.innerJoin(userRoles, eq(users.id, userRoles.userId))
		.innerJoin(roles, eq(userRoles.roleId, roles.id))
		.where(
			and(
				eq(users.id, userId),
				eq(roles.name, 'author'),
				isNull(userRoles.deletedAt),
			),
		)
		.limit(1)

	if (!author[0]) {
		return null
	}

	return {
		...author[0],
		role: (author[0].role as 'admin' | 'user' | 'contributor') || 'user',
		memberships: [],
		roles: [{ name: 'author' }],
		organizationRoles: [],
		fields: {},
		entitlements: [],
	}
}

/**
 * Create an author by assigning the "author" role to a user.
 * @param userId - The user ID to assign the author role to
 * @returns The user with author role
 */
export async function createAuthor(userId: string): Promise<User> {
	// Find the "author" role
	const authorRole = await db.query.roles.findFirst({
		where: eq(roles.name, 'author'),
	})

	if (!authorRole) {
		throw new Error(
			'Author role not found. Please seed the database with the author role.',
		)
	}

	// Check if user already has the author role
	const existingUserRole = await db.query.userRoles.findFirst({
		where: and(
			eq(userRoles.userId, userId),
			eq(userRoles.roleId, authorRole.id),
		),
	})

	if (existingUserRole) {
		// User already has author role, but ensure their role field is updated
		await db
			.update(users)
			.set({
				role: 'author',
			})
			.where(eq(users.id, userId))

		const user = await db.query.users.findFirst({
			where: eq(users.id, userId),
		})

		if (!user) {
			throw new Error('User not found')
		}

		return {
			...user,
			role: (user.role as 'admin' | 'user' | 'contributor') || 'user',
			memberships: [],
			roles: [{ name: 'author' }],
			organizationRoles: [],
			fields: {},
			entitlements: [],
		}
	}

	// Assign the author role
	await db.insert(userRoles).values({
		userId: userId,
		roleId: authorRole.id,
		active: true,
		createdAt: new Date(),
		updatedAt: new Date(),
		deletedAt: null,
	})

	// Update the user's role field to 'author' to reflect author status
	await db
		.update(users)
		.set({
			role: 'author',
		})
		.where(eq(users.id, userId))

	// Get the user
	const user = await db.query.users.findFirst({
		where: eq(users.id, userId),
	})

	if (!user) {
		throw new Error('User not found')
	}

	revalidateTag('authors', 'max')
	return {
		...user,
		role: (user.role as 'admin' | 'user' | 'contributor') || 'user',
		memberships: [],
		roles: [{ name: 'author' }],
		organizationRoles: [],
		fields: {},
		entitlements: [],
	}
}

/**
 * Update an author's name.
 * @param userId - The user ID to update
 * @param name - The new name for the author
 */
export async function updateAuthorName(
	userId: string,
	name: string,
): Promise<User> {
	// Update the user's name
	await db
		.update(users)
		.set({
			name: name,
		})
		.where(eq(users.id, userId))

	// Get the updated user
	const user = await db.query.users.findFirst({
		where: eq(users.id, userId),
	})

	if (!user) {
		throw new Error('User not found')
	}

	revalidateTag('authors', 'max')
	return {
		...user,
		role: (user.role as 'admin' | 'user' | 'contributor') || 'user',
		memberships: [],
		roles: [{ name: 'author' }],
		organizationRoles: [],
		fields: {},
		entitlements: [],
	}
}

/**
 * Delete an author by removing the "author" role from a user.
 * This reverts the user's role back to "user" (does NOT delete the user).
 * @param userId - The user ID to remove the author role from
 */
export async function deleteAuthor(userId: string): Promise<void> {
	// Find the "author" role
	const authorRole = await db.query.roles.findFirst({
		where: eq(roles.name, 'author'),
	})

	if (!authorRole) {
		throw new Error('Author role not found')
	}

	// Soft delete the user role (set deletedAt)
	await db
		.update(userRoles)
		.set({
			deletedAt: new Date(),
			updatedAt: new Date(),
		})
		.where(
			and(eq(userRoles.userId, userId), eq(userRoles.roleId, authorRole.id)),
		)

	// Revert the user's role field back to 'user'
	await db
		.update(users)
		.set({
			role: 'user',
		})
		.where(eq(users.id, userId))

	revalidateTag('authors', 'max')
}

/**
 * Get the author assigned to a resource, with fallback to createdBy.
 * @param resourceId - The resource ID to get the author for
 * @returns The author user, or null if not found
 */
export async function getResourceAuthor(
	resourceId: string,
): Promise<User | null> {
	// Try to get assigned author from ContentResourceAuthor
	const assignedAuthor = await db.query.contentResourceAuthor.findFirst({
		where: eq(contentResourceAuthor.contentResourceId, resourceId),
		with: {
			user: true,
		},
	})

	if (assignedAuthor?.user) {
		return {
			...assignedAuthor.user,
			role:
				(assignedAuthor.user.role as 'admin' | 'user' | 'contributor') ||
				'user',
			memberships: [],
			roles: [],
			organizationRoles: [],
			fields: {},
			entitlements: [],
		}
	}

	// Fallback to createdBy user
	const resource = await db.query.contentResource.findFirst({
		where: eq(contentResource.id, resourceId),
		with: {
			createdBy: true,
		},
	})

	if (resource?.createdBy) {
		return {
			...resource.createdBy,
			role:
				(resource.createdBy.role as 'admin' | 'user' | 'contributor') || 'user',
			memberships: [],
			roles: [],
			organizationRoles: [],
			fields: {},
			entitlements: [],
		}
	}

	return null
}

/**
 * Assign an author (user) to a resource.
 * @param resourceId - The resource ID
 * @param userId - The user ID to assign as author
 */
export async function assignAuthorToResource(
	resourceId: string,
	userId: string,
): Promise<void> {
	// Check if assignment already exists
	const existing = await db.query.contentResourceAuthor.findFirst({
		where: eq(contentResourceAuthor.contentResourceId, resourceId),
	})

	if (existing) {
		// Update existing assignment
		await db
			.update(contentResourceAuthor)
			.set({
				userId: userId,
				updatedAt: new Date(),
			})
			.where(eq(contentResourceAuthor.contentResourceId, resourceId))
	} else {
		// Create new assignment
		await db.insert(contentResourceAuthor).values({
			contentResourceId: resourceId,
			userId: userId,
			createdAt: new Date(),
			updatedAt: new Date(),
		})
	}

	revalidateTag(`resource-${resourceId}`, 'max')
}

/**
 * Remove author assignment from a resource.
 * This will cause the resource to fallback to createdBy.
 * @param resourceId - The resource ID
 */
export async function removeAuthorFromResource(
	resourceId: string,
): Promise<void> {
	await db
		.delete(contentResourceAuthor)
		.where(eq(contentResourceAuthor.contentResourceId, resourceId))

	revalidateTag(`resource-${resourceId}`, 'max')
}
