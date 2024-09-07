import { cookies } from 'next/headers'
import { emailListProvider } from '@/coursebuilder/email-list-provider'
import { courseBuilderAdapter } from '@/db'
import { env } from '@/env.mjs'
import { SubscriberSchema } from '@/schemas/subscriber'
import { createTRPCRouter, publicProcedure } from '@/trpc/api/trpc'
import { getCurrentAbilityRules } from '@/utils/get-current-ability-rules'
import { getUserId } from '@amplitude/analytics-browser'
import { isEmpty } from 'lodash'
import { z } from 'zod'

const convertkitBaseUrl =
	process.env.CONVERTKIT_BASE_URL || 'https://api.convertkit.com/v3/'

export async function getSubscriberFromCookie() {
	const cookieStore = cookies()
	if (!cookieStore) return null

	const cookie = cookieStore.get('ck_subscriber')?.value

	if (!cookie || cookie === 'undefined') return null
	try {
		const subscriber = JSON.parse(cookie)
		if (
			courseBuilderAdapter.getUser &&
			subscriber?.id &&
			!subscriber.email_address
		) {
			return emailListProvider.getSubscriber(subscriber.id.toString())
		}
		if (!subscriber?.id) throw new Error('no subscriber id')
		return SubscriberSchema.parse(subscriber)
	} catch (e) {
		return null
	}
}

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
			return getCurrentAbilityRules({
				lessonId: input?.lessonId,
				moduleId: input?.moduleId,
			})
		}),
})
