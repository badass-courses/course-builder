import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { getList } from '@/lib/lists-query'
import { getServerAuthSession } from '@/server/auth'
import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from '@/trpc/api/trpc'
import { inArray, sql } from 'drizzle-orm'
import { z } from 'zod'

export const contentResourceRouter = createTRPCRouter({
	getList: publicProcedure
		.input(
			z.object({
				slugOrId: z.string(),
			}),
		)
		.query(async ({ input }) => {
			return await getList(input.slugOrId)
		}),
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
	getPublishedResourcesLength: publicProcedure.query(async () => {
		const result = await db.execute(sql`
			SELECT
				type,
				COUNT(*) as count
			FROM ${contentResource}
			WHERE type IN ('post', 'list')
			AND JSON_EXTRACT(fields, '$.state') = 'published'
			GROUP BY type
		`)

		const total = (result.rows as any[]).reduce(
			(sum, row) => sum + Number(row.count),
			0,
		)
		return total
	}),
})
