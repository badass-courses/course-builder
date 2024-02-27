import { abilityRouter } from '@/trpc/api/routers/ability'
import { articlesRouter } from '@/trpc/api/routers/articles'
import { authorsRouter } from '@/trpc/api/routers/authors'
import { imageResourceRouter } from '@/trpc/api/routers/imageResource'
import { moduleRouter } from '@/trpc/api/routers/module'
import { postRouter } from '@/trpc/api/routers/post'
import { tipsRouter } from '@/trpc/api/routers/tips'
import { usersRouter } from '@/trpc/api/routers/users'
import { videoResourceRouter } from '@/trpc/api/routers/videoResource'
import { writingRouter } from '@/trpc/api/routers/writing'
import { createTRPCRouter } from '@/trpc/api/trpc'

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
  writing: writingRouter,
  users: usersRouter,
  authors: authorsRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
