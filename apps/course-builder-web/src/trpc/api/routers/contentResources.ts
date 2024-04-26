import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { getServerAuthSession } from '@/server/auth'
import { createTRPCRouter, publicProcedure } from '@/trpc/api/trpc'
import { inArray } from 'drizzle-orm'

export const contentResourceRouter = createTRPCRouter({
	getAll: publicProcedure.query(async () => {
		const { session, ability } = await getServerAuthSession()
		if (!session?.user || !ability.can('create', 'Content')) {
			throw new Error('Unauthorized')
		}
		return db.query.contentResource.findMany({
			where: inArray(contentResource.type, ['event', 'lesson', 'tutorial']),
			with: {
				resources: true,
			},
		})
	}),
})
