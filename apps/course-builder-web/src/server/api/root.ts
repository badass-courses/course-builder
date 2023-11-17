import {createTRPCRouter} from '@/server/api/trpc'
import {moduleRouter} from '@/server/api/routers/module'
import {postRouter} from '@/server/api/routers/post'
import {tipsRouter} from '@/server/api/routers/tips'
import {videoResourceRouter} from '@/server/api/routers/videoResource'
import {abilityRouter} from '@/server/api/routers/ability'

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  module: moduleRouter,
  post: postRouter,
  tips: tipsRouter,
  videoResources: videoResourceRouter,
  ability: abilityRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
