import { cookies } from 'next/headers'
import { emailListProvider } from '@/coursebuilder/email-list-provider'
import { db } from '@/db'
import { questionResponse } from '@/db/schema'
import { answerSurvey } from '@/lib/surveys-query'
import { SubscriberSchema } from '@/schemas/subscriber'
import { log } from '@/server/logger'
import { createTRPCRouter, publicProcedure } from '@/trpc/api/trpc'
import { guid } from '@/utils/guid'
import type { AdapterUser } from '@auth/core/adapters'
import { format } from 'date-fns'
import { toSnakeCase } from 'drizzle-orm/casing'
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
			const cookieStore = await cookies()
			const convertkitId = cookieStore.get('ck_subscriber_id')?.value
			const subscriberCookie = cookieStore.get('ck_subscriber')?.value

			// Determine user identity
			const userId = session?.user?.id
			const emailListSubscriberId = convertkitId || null

			// Write answers to database
			if (input.surveyId) {
				try {
					const answerRecords = Object.entries(input.answers)
						.filter(([_, value]) => value !== null && value !== undefined)
						.map(([questionSlug, value]) => {
							const answerValue = Array.isArray(value)
								? value.join(', ')
								: String(value)

							if (!answerValue.trim()) return null

							return {
								id: guid(),
								surveyId: input.surveyId!,
								questionId: questionSlug, // Using slug as questionId for now
								userId: userId || null,
								emailListSubscriberId: emailListSubscriberId || null,
								answer: answerValue,
								createdAt: new Date(),
								updatedAt: new Date(),
							}
						})
						.filter(Boolean) as Array<{
						id: string
						surveyId: string
						questionId: string
						userId: string | null
						emailListSubscriberId: string | null
						answer: string
						createdAt: Date
						updatedAt: Date
					}>

					if (answerRecords.length > 0) {
						await db.insert(questionResponse).values(answerRecords)

						await log.info('survey.answers.saved', {
							surveyId: input.surveyId,
							userId,
							emailListSubscriberId,
							answerCount: answerRecords.length,
						})
					}
				} catch (error) {
					await log.error('survey.answers.save.failed', {
						error: (error as Error)?.message,
						surveyId: input.surveyId,
						userId,
					})
				}
			}

			// Continue with ConvertKit integration for backwards compatibility
			let subscriber
			let fields: Record<string, string> = {
				last_surveyed_on: formatDate(new Date()),
				...(input.surveyId && {
					[`completed_${toSnakeCase(input.surveyId)}_survey_on`]: formatDate(
						new Date(),
					),
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

			if (convertkitId) {
				subscriber = SubscriberSchema.parse(
					await emailListProvider.getSubscriber(convertkitId),
				)
			} else if (subscriberCookie) {
				subscriber = SubscriberSchema.parse(JSON.parse(subscriberCookie))
			}

			if (!subscriber && input.email) {
				subscriber = await emailListProvider.subscribeToList({
					listId: process.env.CONVERTKIT_SIGNUP_FORM,
					user: (session?.user || { email: input.email }) as AdapterUser,
					fields,
					listType: 'form',
				})
			}

			if (!subscriber) {
				await log.warn('survey.submit.no.subscriber', {
					surveyId: input.surveyId,
					userId,
				})
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

			return updatedSubscriber
		}),
	answerSurvey: publicProcedure
		.input(
			z.object({
				question: z.string(),
				answer: z.string(),
				surveyId: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const session = ctx.session
			const cookieStore = await cookies()
			const convertkitId = cookieStore.get('ck_subscriber_id')?.value
			const subscriberCookie = cookieStore.get('ck_subscriber')?.value

			// Determine user identity
			const userId = session?.user?.id
			const emailListSubscriberId = convertkitId || null

			// Write answer to database if surveyId provided
			if (input.surveyId && input.question && input.answer?.trim()) {
				try {
					await db.insert(questionResponse).values({
						id: guid(),
						surveyId: input.surveyId,
						questionId: input.question, // Using question slug as questionId
						userId: userId || null,
						emailListSubscriberId: emailListSubscriberId || null,
						answer: input.answer,
						createdAt: new Date(),
						updatedAt: new Date(),
					})

					await log.info('survey.answer.saved', {
						surveyId: input.surveyId,
						questionId: input.question,
						userId,
						emailListSubscriberId,
					})
				} catch (error) {
					await log.error('survey.answer.save.failed', {
						error: (error as Error)?.message,
						surveyId: input.surveyId,
						questionId: input.question,
						userId,
					})
				}
			}

			// Continue with ConvertKit integration for backwards compatibility
			let subscriber
			if (convertkitId) {
				subscriber = SubscriberSchema.parse(
					await emailListProvider.getSubscriber(convertkitId),
				)
			} else if (subscriberCookie) {
				subscriber = SubscriberSchema.parse(JSON.parse(subscriberCookie))
			}

			if (!subscriber) {
				await log.warn('survey.answer.no.subscriber', {
					surveyId: input.surveyId,
					questionId: input.question,
					userId,
				})
				return { error: 'no subscriber found' }
			}

			const updatedSubscriber = await answerSurvey({
				subscriber,
				question: input.question,
				answer: input.answer,
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
