import { getAbilityRules } from '@/ability'
import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from '@/trpc/api/trpc'

export const abilityRouter = createTRPCRouter({
	getCurrentAbilityRules: publicProcedure.query(async ({ ctx }) => {
		const userData = ctx.session?.user
			? {
					id: ctx.session.user.id || '',
					roles: [],
				}
			: undefined

		return getAbilityRules({ user: userData })
	}),
})
