import { cookies } from 'next/headers'
import { emailListProvider } from '@/coursebuilder/email-list-provider'
import { answerSurvey } from '@/lib/surveys-query'
import { SubscriberSchema } from '@/schemas/subscriber'
import { createTRPCRouter, publicProcedure } from '@/trpc/api/trpc'
import type { AdapterUser } from '@auth/core/adapters'
import { format } from 'date-fns'
import { z } from 'zod'

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
			const session = ctx.session
			let subscriber
			const cookieStore = await cookies()
			const convertkitId = cookieStore.get('ck_subscriber_id')?.value

			const subscriberCookie = cookieStore.get('ck_subscriber')?.value

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
					user: (session?.user || { email: input.email }) as AdapterUser,
					fields,
					listType: 'form',
				})
			}

			if (!subscriber) {
				console.log('no subscriber found')
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
			console.log('updatedSubscriber', updatedSubscriber)

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
			const cookieStore = await cookies()
			const convertkitId = cookieStore.get('ck_subscriber_id')?.value

			const subscriberCookie = cookieStore.get('ck_subscriber')?.value

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
