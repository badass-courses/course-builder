import { unstable_cache } from 'next/cache'
import { UserSchema } from '@/ability'
import { db } from '@/db'
import { eggheadPgQuery } from '@/db/eggheadPostgres'
import { accounts, roles, userRoles, users } from '@/db/schema'
import { getPost } from '@/lib/posts-query'
import { getServerAuthSession } from '@/server/auth'
import { and, eq } from 'drizzle-orm'
import { isEmpty } from 'lodash'
import { z } from 'zod'

export const getCachedEggheadInstructorForUser = unstable_cache(
	async (userId: string) => loadEggheadInstructorForUser(userId),
	['users'],
	{ revalidate: 3600 },
)

export const loadEggheadInstructorForUser = async (userId: string) => {
	const user = await db.query.users.findFirst({
		where: eq(users.id, userId),
		with: {
			accounts: true,
		},
	})

	if (!user) {
		return null
	}

	const eggheadAccount = user?.accounts?.find(
		(account) => account.provider === 'egghead',
	)

	if (!eggheadAccount) {
		return null
	}

	const instructor = await eggheadPgQuery(
		`SELECT * FROM instructors WHERE user_id = ${eggheadAccount.providerAccountId}`,
	)

	console.log('instructor', instructor)

	return instructor.rows[0]
}

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
