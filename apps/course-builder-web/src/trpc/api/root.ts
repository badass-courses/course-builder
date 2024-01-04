import {createTRPCRouter} from '@/trpc/api/trpc'
import {moduleRouter} from '@/trpc/api/routers/module'
import {postRouter} from '@/trpc/api/routers/post'
import {tipsRouter} from '@/trpc/api/routers/tips'
import {videoResourceRouter} from '@/trpc/api/routers/videoResource'
import {abilityRouter} from '@/trpc/api/routers/ability'
import {imageResourceRouter} from '@/trpc/api/routers/imageResource'
import {articlesRouter} from '@/trpc/api/routers/articles'

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
  imageResources: imageResourceRouter,
  articles: articlesRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
