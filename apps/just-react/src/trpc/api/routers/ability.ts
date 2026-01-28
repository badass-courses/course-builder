import { cookies } from 'next/headers'
import { env } from '@/env.mjs'
import { getSubscriberFromCookie as getDbSubscriber } from '@/lib/subscribe-actions'
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

/**
 * Get subscriber from cookie. Checks both database subscriber cookie (cb_subscriber)
 * and legacy ConvertKit cookie (ck_subscriber) for backwards compatibility.
 */
export async function getSubscriberFromCookie() {
	// First check our database subscriber cookie
	const dbSubscriber = await getDbSubscriber()
	if (dbSubscriber) {
		// Return in a format compatible with the existing subscriber schema
		return {
			id: 0, // No ConvertKit ID for db subscribers
			email_address: dbSubscriber.email,
			state: 'active' as const,
			created_at: dbSubscriber.subscribedAt,
			fields: {},
		}
	}

	// Fall back to legacy ConvertKit cookie
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
					resourceId: z.string().optional(),
					moduleId: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const abilityRules = await getCurrentAbilityRules({
				resourceId: input?.resourceId,
				moduleId: input?.moduleId,
			})

			return abilityRules
		}),
	getCurrentSubscriberFromCookie: publicProcedure.query(async ({ ctx }) => {
		const subscriber = await getSubscriberFromCookie()
		return subscriber
	}),
})
