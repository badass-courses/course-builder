import { abilityRouter } from '@/trpc/api/routers/ability'
import { contentResourceRouter } from '@/trpc/api/routers/contentResources'
import { eventsRouter } from '@/trpc/api/routers/events'
import { imageResourceRouter } from '@/trpc/api/routers/imageResource'
import { pricingRouter } from '@/trpc/api/routers/pricing'
import { progressRouter } from '@/trpc/api/routers/progress'
import { usersRouter } from '@/trpc/api/routers/users'
import { videoResourceRouter } from '@/trpc/api/routers/videoResource'
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
	videoResources: videoResourceRouter,
	pricing: pricingRouter,
	contentResources: contentResourceRouter,
	events: eventsRouter,
	progress: progressRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
