import { cookies } from 'next/headers'
import { emailListProvider } from '@/coursebuilder/email-list-provider'
import { env } from '@/env.mjs'
import { answerSurvey } from '@/lib/surveys-query'
import { SubscriberSchema } from '@/schemas/subscriber'
import { getServerAuthSession } from '@/server/auth'
import { createTRPCRouter, publicProcedure } from '@/trpc/api/trpc'
import type { AdapterUser } from '@auth/core/adapters'
import cookie, { serialize, type CookieSerializeOptions } from 'cookie'
import { format } from 'date-fns'
import { z } from 'zod'

import { find, isEmpty } from '@coursebuilder/nodash'

const convertkitBaseUrl =
	process.env.CONVERTKIT_BASE_URL || 'https://api.convertkit.com/v3/'

export function formatDate(date: Date) {
	return format(date, 'yyyy-MM-dd HH:mm:ss z')
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
				await emailListProvider.getSubscriber(subscriber.id.toString()),
			)
		}
		if (!subscriber?.id) throw new Error('no subscriber id')
		return SubscriberSchema.parse(subscriber)
	} catch (e) {
		return null
	}
}

export const convertkitRouter = createTRPCRouter({
	answerSurveyMultiple: publicProcedure
		.input(
			z.object({
				answers: z.record(z.string(), z.any()),
				email: z.string().optional(),
				surveyId: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// const { session } = await getServerAuthSession()
			const session = ctx.session
			let subscriber
			const convertkitId = ctx.headers.get(
				process.env.NEXT_PUBLIC_CONVERTKIT_SUBSCRIBER_KEY || 'ck_subscriber_id',
			)

			const subscriberCookie = ctx.headers.get('ck_subscriber')

			let fields: Record<string, string> = {
				last_surveyed_on: formatDate(new Date()),
				...(input.surveyId && {
					[`completed_${input.surveyId}_survey_on`]: formatDate(new Date()),
				}),
			}

			for (const answer in input.answers) {
				const value = input.answers[answer]
				if (value === null || value === undefined) continue

				const stringValue = Array.isArray(value)
					? value.join(', ')
					: String(value)

				if (stringValue.trim()) {
					fields[answer] = stringValue
				}
			}

			console.log('answerSurveyMultiple fields', fields)

			if (convertkitId) {
				subscriber = SubscriberSchema.parse(
					await emailListProvider.getSubscriber(convertkitId),
				)
			} else if (subscriberCookie) {
				subscriber = SubscriberSchema.parse(JSON.parse(subscriberCookie))
			}

			if (!subscriber && input.email) {
				//subscribe user

				subscriber = await emailListProvider.subscribeToList({
					listId: process.env.CONVERTKIT_SIGNUP_FORM,
					user: session?.user as AdapterUser,
					fields,
					listType: 'form',
				})
			}

			if (!subscriber) {
				return { error: 'no subscriber found' }
			}

			let updatedSubscriber = await emailListProvider.getSubscriber(
				subscriber.id.toString(),
			)

			if (fields && emailListProvider?.updateSubscriberFields) {
				updatedSubscriber = await emailListProvider?.updateSubscriberFields?.({
					fields,
					subscriberEmail: updatedSubscriber?.email_address,
					subscriberId: updatedSubscriber?.id,
				})
			}

			if (updatedSubscriber) {
				setCookie(
					ctx.headers,
					'ck_subscriber',
					JSON.stringify(deepOmitNull(updatedSubscriber)),
					{
						secure: process.env.NODE_ENV === 'production',
						path: '/',
						httpOnly: true,
						sameSite: 'lax',
						maxAge: 31556952,
					},
				)

				setCookie(
					ctx.headers,
					'ck_subscriber_id',
					JSON.stringify(updatedSubscriber.id),
					{
						secure: process.env.NODE_ENV === 'production',
						path: '/',
						httpOnly: true,
						sameSite: 'lax',
						maxAge: 31556952,
					},
				)
			}

			return updatedSubscriber
		}),
	answerSurvey: publicProcedure
		.input(
			z.object({
				question: z.string(),
				answer: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			let subscriber
			const convertkitId = ctx.headers.get(
				process.env.NEXT_PUBLIC_CONVERTKIT_SUBSCRIBER_KEY || 'ck_subscriber_id',
			)

			const subscriberCookie = ctx.headers.get('ck_subscriber')

			if (convertkitId) {
				subscriber = SubscriberSchema.parse(
					await emailListProvider.getSubscriber(convertkitId),
				)
			} else if (subscriberCookie) {
				subscriber = SubscriberSchema.parse(JSON.parse(subscriberCookie))
			}

			if (!subscriber) {
				return { error: 'no subscriber found' }
			}

			const updatedSubscriber = await answerSurvey({
				subscriber,
				...input,
			})

			setCookie(
				ctx.headers,
				'ck_subscriber',
				JSON.stringify(deepOmitNull(updatedSubscriber)),
				{
					secure: process.env.NODE_ENV === 'production',
					path: '/',
					httpOnly: true,
					sameSite: 'lax',
					maxAge: 31556952,
				},
			)

			return updatedSubscriber
		}),
})

function deepOmitNull(obj: any): any {
	if (Array.isArray(obj)) {
		return obj.map(deepOmitNull).filter((x) => x !== null)
	}

	if (obj && typeof obj === 'object') {
		return Object.entries(obj).reduce(
			(acc, [key, value]) => {
				const cleaned = deepOmitNull(value)
				if (cleaned !== null) {
					acc[key] = cleaned
				}
				return acc
			},
			{} as Record<string, any>,
		)
	}

	return obj === null ? undefined : obj
}

export function setCookie(
	resHeaders: Headers,
	name: string,
	value: string,
	options?: CookieSerializeOptions,
) {
	resHeaders.append('Set-Cookie', cookie.serialize(name, value, options))
}
