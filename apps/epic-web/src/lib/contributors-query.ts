import { db } from '@/db'
import { roles, userRoles, users } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'

import { User } from '@coursebuilder/core/schemas'

export async function getContributors(): Promise<User[]> {
	// First try to get contributors from the new roles system
	const contributorsFromRoles = await db
		.select()
		.from(users)
		.innerJoin(userRoles, eq(users.id, userRoles.userId))
		.innerJoin(roles, eq(userRoles.roleId, roles.id))
		.where(eq(roles.name, 'contributor'))

	// If we have users from the new system, use them
	if (contributorsFromRoles.length > 0) {
		return contributorsFromRoles.map((row) => ({
			...row.User,
			role: row.User.role as 'admin' | 'user' | 'contributor',
			memberships: [],
			roles: [row.Role],
			organizationRoles: [],
		}))
	}

	// Fallback to the legacy role column for backward compatibility
	const contributorsFromColumn = await db.query.users.findMany({
		where: eq(users.role, 'contributor'),
	})

	// Transform to match the expected User type
	return contributorsFromColumn.map((user) => ({
		...user,
		role: user.role as 'admin' | 'user' | 'contributor',
		memberships: [],
		roles: [],
		organizationRoles: [],
	}))
}
