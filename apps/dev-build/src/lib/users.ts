import { UserSchema } from '@/ability'
import { db } from '@/db'
import { accounts, roles, userRoles, users } from '@/db/schema'
import { getServerAuthSession } from '@/server/auth'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

import { isEmpty } from '@coursebuilder/nodash'

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

export async function discordAccountsForCurrentUser() {
	const token = await getServerAuthSession()
	if (!token.session?.user) return false

	const userAccounts = await db.query.accounts.findMany({
		where: and(
			eq(accounts.userId, token.session.user.id),
			eq(accounts.provider, 'discord'),
		),
	})

	return !isEmpty(userAccounts)
}
