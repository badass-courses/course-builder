import { getSubscriberFromCookie } from '@/lib/convertkit'
import { createTRPCRouter, publicProcedure } from '@/trpc/api/trpc'
import { getCurrentAbilityRules } from '@/utils/get-current-ability-rules'
import { z } from 'zod'

export const abilityRouter = createTRPCRouter({
	getCurrentAbilityRules: publicProcedure
		.input(
			z
				.object({
					lessonId: z.string().optional(),
					moduleId: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const abilityRules = await getCurrentAbilityRules({
				lessonId: input?.lessonId,
				moduleId: input?.moduleId,
			})

			return abilityRules
		}),
	getCurrentSubscriberFromCookie: publicProcedure.query(async ({ ctx }) => {
		return getSubscriberFromCookie()
	}),
})
