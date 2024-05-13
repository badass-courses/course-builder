import { db } from '@/db'
import { accounts } from '@/db/schema'
import { getServerAuthSession } from '@/server/auth'
import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from '@/trpc/api/trpc'
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
})
