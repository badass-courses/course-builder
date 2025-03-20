import { getAbilityRules } from '@/ability'
import { getServerAuthSession } from '@/server/auth'
import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from '@/trpc/api/trpc'

export const abilityRouter = createTRPCRouter({
	getCurrentAbilityRules: publicProcedure.query(async ({ ctx }) => {
		return getAbilityRules({ user: ctx.session?.user })
	}),
})
