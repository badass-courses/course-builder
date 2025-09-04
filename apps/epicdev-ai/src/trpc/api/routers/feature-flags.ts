import { commerceEnabled } from '@/flags'
import { getLessonMuxPlaybackId } from '@/lib/lessons-query'
import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from '@/trpc/api/trpc'
import { z } from 'zod'

export const featureFlagsRouter = createTRPCRouter({
	getCommerceEnabled: publicProcedure.query(async ({ ctx }) => {
		const isCommerceEnabled = await commerceEnabled()
		return isCommerceEnabled
	}),
})
