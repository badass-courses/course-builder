import { TagSchema, type Tag } from '@/lib/tags'
import { createTag, getTags } from '@/lib/tags-query'
import { getServerAuthSession } from '@/server/auth'
import { createTRPCRouter, publicProcedure } from '@/trpc/api/trpc'
import { TRPCError } from '@trpc/server'

export const tagsRouter = createTRPCRouter({
	getTags: publicProcedure.query(async () => {
		return getTags()
	}),
	createTag: publicProcedure
		.input(TagSchema)
		.mutation(async ({ input }: { input: Tag }) => {
			const { ability } = await getServerAuthSession()
			if (!ability.can('create', 'Content')) {
				throw new TRPCError({ code: 'UNAUTHORIZED' })
			}
			return createTag(input)
		}),
})
