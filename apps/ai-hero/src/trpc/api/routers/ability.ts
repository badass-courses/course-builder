import { cookies } from 'next/headers'
import { env } from '@/env.mjs'
import { SubscriberSchema } from '@/schemas/subscriber'
import { getServerAuthSession } from '@/server/auth'
import { createTRPCRouter, publicProcedure } from '@/trpc/api/trpc'
import { getCurrentAbilityRules } from '@/utils/get-current-ability-rules'
import { z } from 'zod'

import { isEmpty } from '@coursebuilder/nodash'

const convertkitBaseUrl =
	process.env.CONVERTKIT_BASE_URL || 'https://api.convertkit.com/v3/'

export async function fetchSubscriber(convertkitId: string | number) {
	if (!env.CONVERTKIT_API_SECRET) {
		console.warn('set CONVERTKIT_API_SECRET')
		return
	}

	let subscriber

	if (convertkitId) {
		const subscriberUrl = `${convertkitBaseUrl}/subscribers/${convertkitId}?api_secret=${process.env.CONVERTKIT_API_SECRET}`
		subscriber = await fetch(subscriberUrl)
			.then((res) => res.json())
			.then(({ subscriber }: any) => {
				return subscriber
			})
	}

	if (isEmpty(subscriber)) return

	const tagsApiUrl = `${convertkitBaseUrl}/subscribers/${
		subscriber.id
	}/tags?api_key=${
		process.env.NEXT_PUBLIC_CONVERTKIT_TOKEN || env.CONVERTKIT_API_KEY
	}`
	const tags = await fetch(tagsApiUrl).then((res) => res.json())

	return { ...subscriber, tags }
}

export async function getSubscriberFromCookie() {
	const cookieStore = await cookies()
	if (!cookieStore) return null

	const cookie = cookieStore.get('ck_subscriber')?.value

	if (!cookie || cookie === 'undefined') return null
	try {
		const subscriber = JSON.parse(cookie)
		if (subscriber?.id && !subscriber.email_address) {
			return SubscriberSchema.parse(
				await fetchSubscriber(subscriber.id.toString()),
			)
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
