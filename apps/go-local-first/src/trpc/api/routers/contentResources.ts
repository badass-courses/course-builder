import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { getServerAuthSession } from '@/server/auth'
import { createTRPCRouter, protectedProcedure } from '@/trpc/api/trpc'
import { inArray } from 'drizzle-orm'
import { z } from 'zod'

export const contentResourceRouter = createTRPCRouter({
	getAll: protectedProcedure
		.input(
			z
				.object({
					contentTypes: z
						.array(z.string())
						.default(['event', 'lesson', 'tutorial', 'workshop']),
				})
				.default({ contentTypes: ['event', 'lesson', 'tutorial', 'workshop'] }),
		)
		.query(async ({ input }) => {
			const { session, ability } = await getServerAuthSession()
			if (!session?.user || !ability.can('create', 'Content')) {
				throw new Error('Unauthorized')
			}
			return db.query.contentResource.findMany({
				where: inArray(contentResource.type, input.contentTypes),
				with: {
					resources: true,
				},
			})
		}),
})
