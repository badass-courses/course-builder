'use server'

import crypto from 'node:crypto'
import { revalidateTag } from 'next/cache'
import { User, UserSchema } from '@/ability'
import { courseBuilderAdapter, db } from '@/db'
import { contentResource, roles, userRoles, users } from '@/db/schema'
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

		const author = await createAuthor(userId)

		await log.info('author.assignment.completed', {
			userId,
			email,
			name,
			wasCreated,
		})

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
 * Get Kent C Dodds user by email (regardless of role).
 * @returns Kent C Dodds user or null if not found
 */
export async function getKentUser(): Promise<User | null> {
	const KENT_EMAIL = 'me@kentcdodds.com'
	const kentUser = await db.query.users.findFirst({
		where: eq(users.email, KENT_EMAIL),
	})

	if (!kentUser) {
		return null
	}

	return {
		...kentUser,
		role: (kentUser.role as 'admin' | 'user' | 'contributor') || 'user',
		memberships: [],
		roles: [],
		organizationRoles: [],
		fields: kentUser.fields || {},
		entitlements: [],
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
	const authorRole = await db.query.roles.findFirst({
		where: eq(roles.name, 'author'),
	})

	if (!authorRole) {
		throw new Error(
			'Author role not found. Please seed the database with the author role.',
		)
	}

	const existingUserRole = await db.query.userRoles.findFirst({
		where: and(
			eq(userRoles.userId, userId),
			eq(userRoles.roleId, authorRole.id),
		),
	})

	if (existingUserRole) {
		// User already has author role via userRoles join table
		// Don't modify users.role - keep their primary role as-is
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

	await db.insert(userRoles).values({
		userId: userId,
		roleId: authorRole.id,
		active: true,
		createdAt: new Date(),
		updatedAt: new Date(),
		deletedAt: null,
	})

	// Don't modify users.role - author role is managed via userRoles join table
	// Keep the user's primary role as-is (admin, user, or contributor)
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
 * Update an author's image.
 * @param userId - The user ID to update
 * @param image - The image URL to set (can be null to remove image)
 * @returns The updated user
 */
export async function updateAuthorImage(
	userId: string,
	image: string | null,
): Promise<User> {
	await db
		.update(users)
		.set({
			image: image,
		})
		.where(eq(users.id, userId))

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
	const authorRole = await db.query.roles.findFirst({
		where: eq(roles.name, 'author'),
	})

	if (!authorRole) {
		throw new Error('Author role not found')
	}

	await db
		.update(userRoles)
		.set({
			deletedAt: new Date(),
			updatedAt: new Date(),
		})
		.where(
			and(eq(userRoles.userId, userId), eq(userRoles.roleId, authorRole.id)),
		)

	await db
		.update(users)
		.set({
			role: 'user',
		})
		.where(eq(users.id, userId))

	revalidateTag('authors', 'max')
}

/**
 * Get the assigned author ID for a resource (if one exists).
 * Reads from contentResource.fields.authorId
 * @param resourceId - The resource ID to check
 * @returns The assigned author user ID, or null if no author is assigned
 */
export async function getAssignedAuthorId(
	resourceId: string,
): Promise<string | null> {
	try {
		const resource = await db.query.contentResource.findFirst({
			where: eq(contentResource.id, resourceId),
		})

		if (!resource) {
			await log.warn('getAssignedAuthorId.resource-not-found', {
				resourceId,
			})
			return null
		}

		const rawFields = resource.fields as any

		let authorId = rawFields?.authorId

		if (authorId === null || authorId === undefined || authorId === '') {
			authorId = null
		}

		await log.info('getAssignedAuthorId.result', {
			resourceId,
			authorId: authorId || null,
			hasFields: !!rawFields,
			fieldsKeys: rawFields ? Object.keys(rawFields).slice(0, 10) : [],
		})

		return typeof authorId === 'string' && authorId.length > 0 ? authorId : null
	} catch (error) {
		await log.error('getAssignedAuthorId.error', {
			resourceId,
			error: error instanceof Error ? error.message : String(error),
		})
		console.error('❌ getAssignedAuthorId error:', error)
		return null
	}
}

/**
 * Get the author assigned to a resource, with fallback to createdBy.
 * Reads authorId from contentResource.fields.authorId
 * @param resourceId - The resource ID to get the author for
 * @returns The author user, or null if not found
 */
export async function getResourceAuthor(
	resourceId: string,
): Promise<User | null> {
	try {
		const resource = await db.query.contentResource.findFirst({
			where: eq(contentResource.id, resourceId),
			with: {
				createdBy: true,
			},
		})

		if (!resource) {
			return null
		}

		const authorId = (resource.fields as any)?.authorId

		if (authorId) {
			const assignedUser = await db.query.users.findFirst({
				where: eq(users.id, authorId),
			})

			if (assignedUser) {
				const userData = {
					...assignedUser,
					role:
						(assignedUser.role as
							| 'admin'
							| 'user'
							| 'contributor'
							| null
							| undefined) || 'user',
					memberships: null,
					roles: null,
					organizationRoles: null,
					fields: assignedUser.fields || {},
					entitlements: [],
				}

				const parsed = UserSchema.safeParse(userData)
				if (!parsed.success) {
					await log.error('getResourceAuthor.user-validation-failed', {
						resourceId,
						errors: parsed.error.format(),
					})
					return {
						...userData,
						id: assignedUser.id,
						email: assignedUser.email || null,
						name: assignedUser.name || null,
					} as User
				}

				return parsed.data
			}
		}

		if (resource.createdBy) {
			const user = resource.createdBy
			const userData = {
				...user,
				role:
					(user.role as 'admin' | 'user' | 'contributor' | null | undefined) ||
					'user',
				memberships: null,
				roles: null,
				organizationRoles: null,
				fields: user.fields || {},
				entitlements: [],
			}

			const parsed = UserSchema.safeParse(userData)
			if (!parsed.success) {
				await log.error('getResourceAuthor.user-validation-failed', {
					resourceId,
					errors: parsed.error.format(),
				})
				return {
					...userData,
					id: user.id,
					email: user.email || null,
					name: user.name || null,
				} as User
			}

			return parsed.data
		}

		return null
	} catch (error) {
		await log.error('getResourceAuthor.error', {
			resourceId,
			error: error instanceof Error ? error.message : String(error),
		})
		throw error
	}
}

/**
 * Assign an author (user) to a resource.
 * Stores authorId in contentResource.fields.authorId
 * @param resourceId - The resource ID
 * @param userId - The user ID to assign as author
 */
export async function assignAuthorToResource(
	resourceId: string,
	userId: string,
): Promise<void> {
	await log.info('assignAuthorToResource.start', {
		resourceId,
		userId,
	})

	try {
		const currentResource =
			await courseBuilderAdapter.getContentResource(resourceId)

		if (!currentResource) {
			await log.error('assignAuthorToResource.resource-not-found', {
				resourceId,
				userId,
			})
			throw new Error(`Resource ${resourceId} not found`)
		}

		const updatedResource =
			await courseBuilderAdapter.updateContentResourceFields({
				id: resourceId,
				fields: {
					...currentResource.fields,
					authorId: userId,
				},
			})

		if (!updatedResource) {
			await log.error('assignAuthorToResource.update-failed', {
				resourceId,
				userId,
				message: 'updateContentResourceFields returned null/undefined',
			})
			throw new Error(`Failed to update resource ${resourceId}`)
		}

		revalidateTag(`resource-${resourceId}`, 'max')

		await log.info('assignAuthorToResource.success', {
			resourceId,
			userId,
		})
	} catch (error) {
		await log.error('assignAuthorToResource.error', {
			resourceId,
			userId,
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		})
		throw error
	}
}

/**
 * Remove author assignment from a resource.
 * Removes authorId from contentResource.fields.authorId
 * This will cause the resource to fallback to createdBy.
 * @param resourceId - The resource ID
 */
export async function removeAuthorFromResource(
	resourceId: string,
): Promise<void> {
	await log.info('removeAuthorFromResource.start', {
		resourceId,
	})

	try {
		// Get current resource to preserve existing fields
		const currentResource =
			await courseBuilderAdapter.getContentResource(resourceId)

		if (!currentResource) {
			await log.error('removeAuthorFromResource.resource-not-found', {
				resourceId,
			})
			throw new Error(`Resource ${resourceId} not found`)
		}

		// Remove authorId from fields
		const { authorId, ...fieldsWithoutAuthorId } = currentResource.fields as any

		const updatedResource =
			await courseBuilderAdapter.updateContentResourceFields({
				id: resourceId,
				fields: fieldsWithoutAuthorId,
			})

		if (!updatedResource) {
			await log.error('removeAuthorFromResource.update-failed', {
				resourceId,
				message: 'updateContentResourceFields returned null/undefined',
			})
			throw new Error(`Failed to update resource ${resourceId}`)
		}

		revalidateTag(`resource-${resourceId}`, 'max')

		await log.info('removeAuthorFromResource.success', {
			resourceId,
		})
	} catch (error) {
		await log.error('removeAuthorFromResource.error', {
			resourceId,
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		})
		throw error
	}
}
