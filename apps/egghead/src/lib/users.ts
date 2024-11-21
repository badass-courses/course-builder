import { unstable_cache } from 'next/cache'
import { UserSchema } from '@/ability'
import { db } from '@/db'
import { eggheadPgQuery } from '@/db/eggheadPostgres'
import { accounts, profiles, roles, userRoles, users } from '@/db/schema'
import { getServerAuthSession } from '@/server/auth'
import { TRPCError } from '@trpc/server'
import { and, eq } from 'drizzle-orm'
import { isEmpty } from 'lodash'
import { z } from 'zod'

export const getCachedEggheadInstructors = unstable_cache(
	async () => loadEggheadInstructors(),
	['users'],
	{ revalidate: 3600, tags: ['users'] },
)

export const loadEggheadInstructors = async () => {
	const instructors = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			image: users.image,
		})
		.from(users)
		.innerJoin(userRoles, eq(users.id, userRoles.userId))
		.innerJoin(roles, eq(userRoles.roleId, roles.id))
		.where(eq(roles.name, 'contributor'))

	if (!instructors) {
		return []
	}

	return instructors
}
export const getCachedEggheadInstructorForUser = unstable_cache(
	async (userId: string) => loadEggheadInstructorForUser(userId),
	['users'],
	{ revalidate: 3600, tags: ['users'] },
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

interface UpdateProfileData {
	user: any
	name: string
	slackChannelId: string
	slackId: string
	twitter: string
	website: string
	bio: string
	blueSky: string
	existingFields?: Record<string, any>
}

export async function updateContributorProfile(data: UpdateProfileData) {
	await db.transaction(async (tx) => {
		await tx
			.update(users)
			.set({
				name: data.name,
				fields: {
					...(data.existingFields || {}),
					slackChannelId: data.slackChannelId,
					slackId: data.slackId,
				},
			})
			.where(eq(users.id, data.user.id))

		const existingProfile = await tx.query.profiles.findFirst({
			where: and(
				eq(profiles.userId, data.user.id),
				eq(profiles.type, 'instructor'),
			),
		})

		const profileId = existingProfile?.id || crypto.randomUUID()

		await tx
			.insert(profiles)
			.values({
				id: profileId,
				userId: data.user.id,
				type: 'instructor',
				fields: {
					twitter: data.twitter,
					website: data.website,
					bio: data.bio,
					blueSky: data.blueSky,
				},
			})
			.onDuplicateKeyUpdate({
				set: {
					fields: {
						twitter: data.twitter,
						website: data.website,
						bio: data.bio,
						blueSky: data.blueSky,
					},
				},
			})
	})

	const eggheadAccount = data.user.accounts?.find(
		(account: { provider: string }) => account.provider === 'egghead',
	)

	try {
		if (!eggheadAccount) {
			throw new TRPCError({
				message: `No egghead account found for ${data.user.id} found`,
				code: 'INTERNAL_SERVER_ERROR',
			})
		}

		const pgResult = await eggheadPgQuery(
			`
			    UPDATE instructors
			    SET
			    twitter = $1,
			    website = $2,
			    bio_short = $3
			    WHERE user_id = $4
			    RETURNING *
			  `,
			[data.twitter, data.website, data.bio, eggheadAccount.providerAccountId],
		)
	} catch (e) {
		console.log({ e })
		throw new TRPCError({
			message: 'Failed to sync with egghead',
			code: 'INTERNAL_SERVER_ERROR',
		})
	}

	return true
}
