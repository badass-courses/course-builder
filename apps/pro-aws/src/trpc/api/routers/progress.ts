import { cookies } from 'next/headers'
import { addProgress, sendInngestProgressEvent } from '@/app/actions'
import { courseBuilderAdapter } from '@/db'
import { getLesson } from '@/lib/lessons-query'
import { SubscriberSchema } from '@/schemas/subscriber'
import { getServerAuthSession } from '@/server/auth'
import { createTRPCRouter, publicProcedure } from '@/trpc/api/trpc'
import { z } from 'zod'

export const progressRouter = createTRPCRouter({
	add: publicProcedure
		.input(
			z.object({
				resourceId: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return addProgress(input)
		}),
	toggle: publicProcedure
		.input(
			z.object({
				lessonSlug: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { session, ability } = await getServerAuthSession()
			const token = session?.user
			const { findOrCreateUser, toggleLessonProgressForUser } =
				courseBuilderAdapter
			try {
				const lesson = await getLesson(input.lessonSlug)
				if (!lesson) return { error: 'no lesson found' }
				if (token) {
					const progress = await toggleLessonProgressForUser({
						userId: token.id as string,
						lessonId: lesson.id as string,
					})

					if (!progress) return { error: 'no progress found' }

					if (progress.completedAt) {
						await sendInngestProgressEvent({
							user: token,
							lessonId: lesson.id,
						})
					}

					return progress
				} else {
					const subscriberCookie = cookies().get('ck_subscriber')

					if (!subscriberCookie) {
						console.debug('no subscriber cookie')
						return { error: 'no subscriber found' }
					}

					const subscriber = SubscriberSchema.parse(
						JSON.parse(subscriberCookie.value),
					)

					if (!subscriber?.email_address) {
						console.debug('no subscriber cookie')
						return { error: 'no subscriber found' }
					}

					const { user } = await findOrCreateUser(subscriber.email_address)

					const progress = await toggleLessonProgressForUser({
						userId: user.id,
						lessonId: lesson.id as string,
					})

					if (!progress) return { error: 'no progress found' }

					if (progress.completedAt) {
						await sendInngestProgressEvent({
							user: token,
							lessonId: lesson.id,
							lessonSlug: lesson.fields?.slug,
						})
					}

					return progress
				}
			} catch (error) {
				console.error(error)
				let message = 'Unknown Error'
				if (error instanceof Error) message = error.message
				return { error: message }
			}
		}),
	get: publicProcedure.query(async ({ ctx }) => {
		const { findOrCreateUser, getLessonProgressForUser } = courseBuilderAdapter
		const { session, ability } = await getServerAuthSession()
		const user = session?.user
		if (user) {
			try {
				const lessonProgress = await getLessonProgressForUser(user.id as string)
				return lessonProgress || []
			} catch (error) {
				console.error(error)
				let message = 'Unknown Error'
				if (error instanceof Error) message = error.message
				return []
			}
		} else {
			const subscriberCookie = cookies().get('ck_subscriber')

			if (!subscriberCookie) {
				console.debug('no subscriber cookie')
				return { error: 'no subscriber found' }
			}

			const subscriber = SubscriberSchema.parse(
				JSON.parse(subscriberCookie.value),
			)

			if (!subscriber?.email_address) {
				console.debug('no subscriber cookie')
				return { error: 'no subscriber found' }
			}

			const { user } = await findOrCreateUser(subscriber.email_address)

			const lessonProgress = await getLessonProgressForUser(user.id as string)
			return lessonProgress || []
		}
	}),
	clear: publicProcedure
		.input(
			z.object({
				lessons: z.array(
					z.object({
						id: z.string(),
						slug: z.string(),
					}),
				),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { session, ability } = await getServerAuthSession()
			const token = session?.user
			const lessons = input.lessons
			if (token) {
				try {
					const { clearLessonProgressForUser } = courseBuilderAdapter
					await clearLessonProgressForUser({
						userId: token.id as string,
						lessons: lessons,
					})
				} catch (error) {
					console.error(error)
					let message = 'Unknown Error'
					if (error instanceof Error) message = error.message
					return { error: message }
				}
			}
		}),
})
