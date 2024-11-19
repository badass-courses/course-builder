import { db } from '@/db'
import { eggheadPgQuery } from '@/db/eggheadPostgres'
import { accounts, profiles, userProfiles, users } from '@/db/schema'
import { getServerAuthSession } from '@/server/auth'
import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from '@/trpc/api/trpc'
import { TRPCError } from '@trpc/server'
import { and, eq } from 'drizzle-orm'
import { isEmpty } from 'lodash'
import { z } from 'zod'

export const usersRouter = createTRPCRouter({
	get: publicProcedure
		.input(
			z.object({
				userId: z.string(),
			}),
		)
		.query(async ({ ctx, input }) => {
			return await db.query.users.findFirst({
				where: (users, { eq }) => eq(users.id, input.userId),
			})
		}),

	githubConnected: publicProcedure.query(async ({ ctx, input }) => {
		const token = await getServerAuthSession()
		if (!token.session?.user) return false

		const userAccounts = await db.query.accounts.findMany({
			where: and(
				eq(accounts.userId, token.session.user.id),
				eq(accounts.provider, 'github'),
			),
		})

		return !isEmpty(userAccounts)
	}),
	updateProfile: publicProcedure
		.input(
			z.object({
				name: z.string(),
				email: z.string().email(),
				twitter: z.string(),
				website: z.string(),
				blueSky: z.string(),
				bio: z.string(),
				slackChannelId: z.string(),
				slackId: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const token = await getServerAuthSession()
			const user = token.session?.user
			if (!user)
				throw new TRPCError({
					message: 'Not authenticated',
					code: 'UNAUTHORIZED',
				})
			const userId = user.id

			const fullUser = await db.query.users.findFirst({
				where: eq(users.id, userId),
				with: {
					accounts: true,
					profiles: true,
				},
			})

			try {
				await db.transaction(async (tx) => {
					await tx
						.update(users)
						.set({
							name: input.name,
							fields: {
								...(fullUser && fullUser.fields),
								slackChannelId: input.slackChannelId,
								slackId: input.slackId,
							},
						})
						.where(eq(users.id, userId))

					const existingProfile = await tx.query.profiles.findFirst({
						where: and(
							eq(profiles.userId, userId),
							eq(profiles.type, 'instructor'),
						),
					})

					const profileId = existingProfile?.id || crypto.randomUUID()

					await tx
						.insert(profiles)
						.values({
							id: profileId,
							userId,
							type: 'instructor',
							fields: {
								twitter: input.twitter,
								website: input.website,
								bio: input.bio,
								blueSky: input.blueSky,
							},
						})
						.onDuplicateKeyUpdate({
							set: {
								fields: {
									twitter: input.twitter,
									website: input.website,
									bio: input.bio,
									blueSky: input.blueSky,
								},
							},
						})

					if (!existingProfile) {
						await tx.insert(userProfiles).values({
							userId,
							profileId,
						})
					}

					return { success: true }
				})
			} catch (e) {
				throw new TRPCError({
					message: 'Failed to update profile',
					code: 'INTERNAL_SERVER_ERROR',
				})
			}

			const eggheadAccount = fullUser?.accounts?.find(
				(account) => account.provider === 'egghead',
			)

			try {
				if (!eggheadAccount) {
					throw new TRPCError({
						message: `No egghead account found for ${userId} found`,
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
					[
						input.twitter,
						input.website,
						input.bio,
						eggheadAccount.providerAccountId,
					],
				)
			} catch (e) {
				console.log({ e })
				throw new TRPCError({
					message: 'Failed to sync with egghead',
					code: 'INTERNAL_SERVER_ERROR',
				})
			}

			return {
				name: input.name,
				fields: {
					...(fullUser && fullUser.fields),
					twitter: input.twitter,
					website: input.website,
					bio: input.bio,
					blueSky: input.blueSky,
				},
			}
		}),
})
