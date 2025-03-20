import { abilityRouter } from '@/trpc/api/routers/ability'
import { contentResourcesRouter } from '@/trpc/api/routers/contentResources'
import { sectionRouter } from '@/trpc/api/routers/section'
import { createCallerFactory, createTRPCRouter } from '@/trpc/api/trpc'

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
	ability: abilityRouter,
	section: sectionRouter,
	contentResources: contentResourcesRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter)
