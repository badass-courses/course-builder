import { UserSchema } from '@/ability'
import { db } from '@/db'
import { accounts, roles, userRoles, users } from '@/db/schema'
import { getServerAuthSession } from '@/server/auth'
import { and, eq } from 'drizzle-orm'
import { isEmpty } from 'lodash'
import { z } from 'zod'

export const loadUsersForRole = async (role: string) => {
	const usersByRole = await db
		.select({
			id: users.id,
			name: users.name,
			image: users.image,
			role: roles.name,
		})
		.from(users)
		.rightJoin(userRoles, eq(users.id, userRoles.userId))
		.leftJoin(roles, eq(userRoles.roleId, roles.id))
		.where(eq(roles.name, role))

	return z.array(UserSchema).parse(usersByRole)
}

export async function githubAccountsForCurrentUser() {
	const token = await getServerAuthSession()
	if (!token.session?.user) return false

	const userAccounts = await db.query.accounts.findMany({
		where: and(
			eq(accounts.userId, token.session.user.id),
			eq(accounts.provider, 'github'),
		),
	})

	return !isEmpty(userAccounts)
}

export async function addRoleToUser(userId: string, roleName: string) {
	const contributorRole = await db.query.roles.findFirst({
		where: (roles, { eq }) => eq(roles.name, roleName),
	})
	if (contributorRole) {
		const existingUserRole = await db.query.userRoles.findFirst({
			where: (userRoles, { and, eq }) =>
				and(
					eq(userRoles.userId, userId),
					eq(userRoles.roleId, contributorRole.id),
				),
		})

		if (!existingUserRole) {
			await db.insert(userRoles).values({
				userId: userId,
				roleId: contributorRole.id,
				active: true,
				createdAt: new Date(),
				updatedAt: new Date(),
				deletedAt: null,
			})
			console.debug(`user ${userId} now has role ${roleName}`)
		} else {
			console.debug(`user already has role ${roleName}`)
		}
	}
}
