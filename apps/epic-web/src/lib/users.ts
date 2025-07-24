// import { unstable_noStore as noStore } from 'next/cache'
import { UserSchema } from '@/ability'
import { db } from '@/db'
import { accounts, roles, userRoles, users } from '@/db/schema'
import { getServerAuthSession } from '@/server/auth'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

import { isEmpty } from '@coursebuilder/nodash'

type User = z.infer<typeof UserSchema>

export const loadUsersForRole = async (role: string) => {
	const usersByRole = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			image: users.image,
			role: roles.name,
		})
		.from(users)
		.rightJoin(userRoles, eq(users.id, userRoles.userId))
		.leftJoin(roles, eq(userRoles.roleId, roles.id))
		.where(eq(roles.name, role))

	return z.array(UserSchema).parse(usersByRole)
}

// Fetch users where the `users.role` column matches given role (case-insensitive)
export const loadUsersByDirectRole = async (role: string) => {
	const usersByColumn = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			image: users.image,
			role: users.role,
		})
		.from(users)
		.where(eq(users.role, role))

	return z.array(UserSchema).parse(usersByColumn)
}

export async function getAuthors() {
	const results = await Promise.allSettled([
		loadUsersForRole('admin'),
		loadUsersForRole('contributor'),
		loadUsersByDirectRole('contributor'),
	])

	const [
		adminsResult,
		contributorsViaRoleTableResult,
		contributorsDirectResult,
	] = results

	const admins = adminsResult.status === 'fulfilled' ? adminsResult.value : []
	const contributorsViaRoleTable =
		contributorsViaRoleTableResult.status === 'fulfilled'
			? contributorsViaRoleTableResult.value
			: []
	const contributorsDirect =
		contributorsDirectResult.status === 'fulfilled'
			? contributorsDirectResult.value
			: []

	const contributors = [...contributorsViaRoleTable, ...contributorsDirect]

	// merge unique by id
	const usersMap = new Map<string, User>()
	;[...admins, ...contributors].forEach((user) => {
		usersMap.set(user.id, user)
	})

	const authors = Array.from(usersMap.values()).map((u) => ({
		...u,
		displayName: u.name || u.email || u.id,
	}))

	return authors
}

export async function getUserByEmail(email: string) {
	const user = await db.query.users.findFirst({
		where: eq(users.email, email),
		with: {
			roles: {
				with: {
					role: true,
				},
			},
		},
	})

	return user
}

export async function getCurrentUserRoles(): Promise<string[]> {
	const { session } = await getServerAuthSession()

	if (!session?.user?.email) {
		return []
	}

	const user = await getUserByEmail(session.user.email)

	if (!user || !user.roles) {
		return []
	}

	return user.roles.map((r) => r.role.name)
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
