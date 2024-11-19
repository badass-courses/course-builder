import { getAbilityRules } from '@/ability'
import { getServerAuthSession } from '@/server/auth'
import { createTRPCRouter, publicProcedure } from '@/trpc/api/trpc'

export const abilityRouter = createTRPCRouter({
	getCurrentAbilityRules: publicProcedure.query(async () => {
		const { session } = await getServerAuthSession()
		const user = session?.user
			? {
					id: session.user.id,
					role: session.user.role,
					roles: session.user.roles.map((role) => ({
						...role,
						createdAt: null,
						updatedAt: null,
						deletedAt: null,
					})),
				}
			: undefined
		return getAbilityRules({ user })
	}),
})
