import { getAbilityRules } from '@/ability'
import { getServerAuthSession } from '@/server/auth'
import { createTRPCRouter, publicProcedure } from '@/trpc/api/trpc'

export const abilityRouter = createTRPCRouter({
	getCurrentAbilityRules: publicProcedure.query(async () => {
		const session = await getServerAuthSession()
		return getAbilityRules({ user: session?.user })
	}),
})
