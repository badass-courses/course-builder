import { cookies } from 'next/headers'
import { emailListProvider } from '@/coursebuilder/email-list-provider'
import { db } from '@/db'
import { contentResource, questionResponse } from '@/db/schema'
import { getSubscriberFromCookie } from '@/lib/convertkit'
import { answerSurvey } from '@/lib/surveys-query'
import { SubscriberSchema } from '@/schemas/subscriber'
import { log } from '@/server/logger'
import { createTRPCRouter, publicProcedure } from '@/trpc/api/trpc'
import { guid } from '@/utils/guid'
import type { AdapterUser } from '@auth/core/adapters'
import { format } from 'date-fns'
import { and, eq, sql } from 'drizzle-orm'
import { toSnakeCase } from 'drizzle-orm/casing'
import { z } from 'zod'

export function formatDate(date: Date) {
	return format(date, 'yyyy-MM-dd HH:mm:ss z')
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

			// ConvertKit integration - get/create subscriber first
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
					userId: session?.user?.id,
				})
				return { error: 'no subscriber found' }
			}

			// Now determine user identity with subscriber info
			let userId = session?.user?.id
			const emailListSubscriberId = subscriber.id.toString()

			// Check if user exists with this email
			if (!userId && subscriber.email_address) {
				const existingUser = await db.query.users.findFirst({
					where: (users, { eq }) => eq(users.email, subscriber.email_address),
				})
				if (existingUser) {
					userId = existingUser.id
				}
			}

			await log.info('survey.answers.identity', {
				hasSession: !!session,
				userId,
				emailListSubscriberId,
				surveyId: input.surveyId,
				answerCount: Object.keys(input.answers).length,
			})

			// Write answers to database
			if (input.surveyId) {
				try {
					// Lookup survey ID by slug
					const survey = await db.query.contentResource.findFirst({
						where: and(
							eq(contentResource.type, 'survey'),
							sql`JSON_EXTRACT(${contentResource.fields}, '$.slug') = ${input.surveyId}`,
						),
					})

					// Use actual survey ID, fallback to input if not found
					const surveyId = survey?.id || input.surveyId

					// Get all question slugs
					const questionSlugs = Object.keys(input.answers).filter(
						(slug) =>
							input.answers[slug] !== null && input.answers[slug] !== undefined,
					)

					// Lookup question IDs by slug
					const questions = await db.query.contentResource.findMany({
						where: and(
							eq(contentResource.type, 'question'),
							sql`JSON_EXTRACT(${contentResource.fields}, '$.slug') IN (${sql.join(
								questionSlugs.map((slug) => sql`${slug}`),
								sql`, `,
							)})`,
						),
					})

					// Build slug -> ID map
					const slugToIdMap = new Map<string, string>()
					for (const q of questions) {
						const fields = q.fields as any
						if (fields.slug) {
							slugToIdMap.set(fields.slug, q.id)
						}
					}

					const answerRecords = Object.entries(input.answers)
						.filter(([_, value]) => value !== null && value !== undefined)
						.map(([questionSlug, value]) => {
							const answerValue = Array.isArray(value)
								? value.join(', ')
								: String(value)

							if (!answerValue.trim()) return null

							// Use actual question ID from lookup, fallback to slug if not found
							const questionId = slugToIdMap.get(questionSlug) || questionSlug

							return {
								id: guid(),
								surveyId,
								questionId,
								userId: userId || null,
								emailListSubscriberId: emailListSubscriberId || null,
								fields: { answer: answerValue },
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
						fields: Record<string, any>
						createdAt: Date
						updatedAt: Date
					}>

					if (answerRecords.length > 0) {
						await db.insert(questionResponse).values(answerRecords)

						await log.info('survey.answers.saved', {
							surveyId,
							surveySlug: input.surveyId,
							userId,
							emailListSubscriberId,
							answerCount: answerRecords.length,
						})
					}
				} catch (error) {
					await log.error('survey.answers.save.failed', {
						error: (error as Error)?.message,
						surveySlug: input.surveyId,
						userId,
					})
				}
			}

			// Update subscriber fields in ConvertKit
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

			// Get subscriber first
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
					userId: session?.user?.id,
				})
				return { error: 'no subscriber found' }
			}

			// Determine user identity
			let userId = session?.user?.id
			const emailListSubscriberId = subscriber.id.toString()

			// Check if user exists with this email
			if (!userId && subscriber.email_address) {
				const existingUser = await db.query.users.findFirst({
					where: (users, { eq }) => eq(users.email, subscriber.email_address),
				})
				if (existingUser) {
					userId = existingUser.id
				}
			}

			await log.info('survey.answer.identity', {
				hasSession: !!session,
				userId,
				emailListSubscriberId,
				surveySlug: input.surveyId,
			})

			// Write answer to database if surveyId provided
			if (input.surveyId && input.question && input.answer?.trim()) {
				try {
					// Lookup survey ID by slug
					const survey = await db.query.contentResource.findFirst({
						where: and(
							eq(contentResource.type, 'survey'),
							sql`JSON_EXTRACT(${contentResource.fields}, '$.slug') = ${input.surveyId}`,
						),
					})

					// Use actual survey ID, fallback to input if not found
					const surveyId = survey?.id || input.surveyId

					// Lookup question ID by slug
					const question = await db.query.contentResource.findFirst({
						where: and(
							eq(contentResource.type, 'question'),
							sql`JSON_EXTRACT(${contentResource.fields}, '$.slug') = ${input.question}`,
						),
					})

					// Use actual question ID, fallback to slug if not found
					const questionId = question?.id || input.question

					await db.insert(questionResponse).values({
						id: guid(),
						surveyId,
						questionId,
						userId: userId || null,
						emailListSubscriberId: emailListSubscriberId || null,
						fields: { answer: input.answer },
						createdAt: new Date(),
						updatedAt: new Date(),
					})

					await log.info('survey.answer.saved', {
						surveyId,
						surveySlug: input.surveyId,
						questionId,
						questionSlug: input.question,
						userId,
						emailListSubscriberId,
					})
				} catch (error) {
					await log.error('survey.answer.save.failed', {
						error: (error as Error)?.message,
						surveySlug: input.surveyId,
						questionSlug: input.question,
						userId,
					})
				}
			}

			// Update ConvertKit fields
			const updatedSubscriber = await answerSurvey({
				subscriber,
				question: input.question,
				answer: input.answer,
			})

			return updatedSubscriber
		}),
})
