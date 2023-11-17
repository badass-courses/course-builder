import {createTRPCRouter, publicProcedure} from '@/server/api/trpc'
import {getServerAuthSession} from '@/server/auth'
import {getAbilityRules} from '@/lib/ability'

export const abilityRouter = createTRPCRouter({
  getCurrentAbilityRules: publicProcedure.query(async () => {
    const session = await getServerAuthSession()
    return getAbilityRules({user: session?.user})
  }),
})
