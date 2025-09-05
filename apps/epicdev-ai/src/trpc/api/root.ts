import { abilityRouter } from '@/trpc/api/routers/ability'
import { certificateRouter } from '@/trpc/api/routers/certificate'
import { contentResourceRouter } from '@/trpc/api/routers/contentResources'
import { deviceVerificationRouter } from '@/trpc/api/routers/device-verification'
import { eventsRouter } from '@/trpc/api/routers/events'
import { imageResourceRouter } from '@/trpc/api/routers/imageResource'
import { lessonsRouter } from '@/trpc/api/routers/lessons'
import { pricingRouter } from '@/trpc/api/routers/pricing'
import { progressRouter } from '@/trpc/api/routers/progress'
import { solutionsRouter } from '@/trpc/api/routers/solutions'
import { usersRouter } from '@/trpc/api/routers/users'
import { videoResourceRouter } from '@/trpc/api/routers/videoResource'
import { createTRPCRouter } from '@/trpc/api/trpc'

import { emailsRouter } from './routers/emails'
import { exercisesRouter } from './routers/exercises'
import { featureFlagsRouter } from './routers/feature-flags'
import { tagsRouter } from './routers/tags'
import { typesenseRouter } from './routers/typesense'

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
	lessons: lessonsRouter,
	solutions: solutionsRouter,
	certificate: certificateRouter,
	deviceVerification: deviceVerificationRouter,
	typesense: typesenseRouter,
	tags: tagsRouter,
	emails: emailsRouter,
	exercises: exercisesRouter,
	featureFlags: featureFlagsRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
