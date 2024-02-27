import { getAuthors } from '@/lib/authors'
import { createTRPCRouter, publicProcedure } from '@/trpc/api/trpc'

export const authorsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx, input }) => {
    return await getAuthors()
  }),
})
