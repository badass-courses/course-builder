import { EggheadTagFieldsSchema } from '@/lib/tags'
import { createTag, getTags } from '@/lib/tags-query'
import { createTRPCRouter, publicProcedure } from '@/trpc/api/trpc'
import { z } from 'zod'

export const tagsRouter = createTRPCRouter({
	getTags: publicProcedure.query(async () => {
		return getTags()
	}),

	createTag: publicProcedure
		.input(
			z.object({
				type: z.literal('topic'),
				fields: EggheadTagFieldsSchema,
			}),
		)
		.mutation(async ({ input }) => {
			return createTag(input)
		}),
})
