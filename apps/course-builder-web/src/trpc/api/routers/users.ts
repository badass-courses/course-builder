import { db } from '@/server/db'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/trpc/api/trpc'
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
})
