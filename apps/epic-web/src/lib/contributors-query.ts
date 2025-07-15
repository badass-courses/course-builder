import { db } from '@/db'
import { roles, userRoles, users } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'

import { User } from '@coursebuilder/core/schemas'

export async function getContributors(): Promise<User[]> {
	// Query contributors from users.role column only (avoiding relational queries)
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
