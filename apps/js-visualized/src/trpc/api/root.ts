import { abilityRouter } from '@/trpc/api/routers/ability'
import { contentResourceRouter } from '@/trpc/api/routers/contentResources'
import { imageResourceRouter } from '@/trpc/api/routers/imageResource'
import { lessonsRouter } from '@/trpc/api/routers/lessons'
import { progressRouter } from '@/trpc/api/routers/progress'
import { usersRouter } from '@/trpc/api/routers/users'
import { videoResourceRouter } from '@/trpc/api/routers/videoResource'
import { createCallerFactory, createTRPCRouter } from '@/trpc/api/trpc'

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
	ability: abilityRouter,
	imageResources: imageResourceRouter,
	users: usersRouter,
	videoResources: videoResourceRouter,
	contentResources: contentResourceRouter,
	progress: progressRouter,
	lessons: lessonsRouter,
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
