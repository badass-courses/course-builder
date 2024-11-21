import { db } from '@/db'
import { eggheadPgQuery } from '@/db/eggheadPostgres'
import { accounts, profiles, users } from '@/db/schema'
import { updateContributorProfile } from '@/lib/users'
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
					roles: {
						with: {
							role: true,
						},
					},
				},
			})

			const isContributor = fullUser?.roles?.some(
				(roleRelation) => roleRelation.role.name === 'contributor',
			)

			if (isContributor) {
				try {
					await updateContributorProfile({
						...input,
						user: fullUser,
					})
				} catch (e) {
					throw new TRPCError({
						message: 'Failed to update contributor profile',
						code: 'INTERNAL_SERVER_ERROR',
					})
				}
			}

			return {
				name: input.name,
				...(fullUser && fullUser.fields),
				twitter: input.twitter,
				website: input.website,
				bio: input.bio,
				blueSky: input.blueSky,
			}
		}),
})
