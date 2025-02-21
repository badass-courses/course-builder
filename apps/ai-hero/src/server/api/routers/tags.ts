import { TagSchema, type Tag } from '@/lib/tags'
import { createTag, getTags } from '@/lib/tags-query'
import { createTRPCRouter, publicProcedure } from '@/trpc/api/trpc'
import { z } from 'zod'

export const tagsRouter = createTRPCRouter({
	getTags: publicProcedure.query(async () => {
		return getTags()
	}),
	createTag: publicProcedure
		.input(TagSchema)
		.mutation(async ({ input }: { input: Tag }) => {
			return createTag(input)
		}),
})
