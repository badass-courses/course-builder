import { sanityQuery } from '@/server/sanity.server'
import { createTRPCRouter, publicProcedure } from '@/trpc/api/trpc'

export const imageResourceRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx, input }) => {
    return sanityQuery<{ _id: string; url: string; alt?: string }[]>(
      `*[_type == "imageResource"] | order(_createdAt desc)`,
      { useCdn: false },
    )
  }),
})
