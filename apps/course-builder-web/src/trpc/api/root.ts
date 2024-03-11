import { abilityRouter } from '@/trpc/api/routers/ability'
import { imageResourceRouter } from '@/trpc/api/routers/imageResource'
import { usersRouter } from '@/trpc/api/routers/users'
import { createTRPCRouter } from '@/trpc/api/trpc'

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  ability: abilityRouter,
  imageResources: imageResourceRouter,
  users: usersRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
