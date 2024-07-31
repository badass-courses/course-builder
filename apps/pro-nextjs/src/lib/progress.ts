'use server'

import { cookies } from 'next/headers'
import { courseBuilderAdapter } from '@/db'
import { LESSON_COMPLETED_EVENT } from '@/inngest/events/lesson-completed'
import { inngest } from '@/inngest/inngest.server'
import { SubscriberSchema } from '@/schemas/subscriber'
import { getServerAuthSession } from '@/server/auth'

import {
	resourceProgressSchema,
	type ModuleProgress,
} from '@coursebuilder/core/schemas'

export async function addProgress({ resourceId }: { resourceId: string }) {
	const { session } = await getServerAuthSession()
	const user = session?.user

	try {
		if (user) {
			const progress = await courseBuilderAdapter.completeLessonProgressForUser(
				{
					userId: user.id,
					lessonId: resourceId,
				},
			)
			await sendInngestProgressEvent({
				user: user,
				lessonId: resourceId,
			})
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

			const { user } = await courseBuilderAdapter.findOrCreateUser(
				subscriber.email_address,
				subscriber.first_name,
			)

			const progress = await courseBuilderAdapter.completeLessonProgressForUser(
				{
					userId: user.id,
					lessonId: resourceId,
				},
			)
			return progress
		}
	} catch (error) {
		console.error(error)
		let message = 'Unknown Error'
		if (error instanceof Error) message = error.message
		return { error: message }
	}
}

export async function toggleProgress({ resourceId }: { resourceId: string }) {
	const { session } = await getServerAuthSession()
	const user = session?.user

	try {
		if (user) {
			const progress = await courseBuilderAdapter.toggleLessonProgressForUser({
				userId: user.id,
				lessonId: resourceId,
			})
			if (progress?.completedAt) {
				await sendInngestProgressEvent({
					user: user,
					lessonId: resourceId,
				})
			}

			return resourceProgressSchema.parse(progress)
		} else {
			const subscriberCookie = cookies().get('ck_subscriber')

			if (!subscriberCookie) {
				console.debug('no subscriber cookie')
				return null
			}

			const subscriber = SubscriberSchema.parse(
				JSON.parse(subscriberCookie.value),
			)

			if (!subscriber?.email_address) {
				console.debug('no subscriber cookie')
				return null
			}

			const { user } = await courseBuilderAdapter.findOrCreateUser(
				subscriber.email_address,
				subscriber.first_name,
			)

			const progress = await courseBuilderAdapter.toggleLessonProgressForUser({
				userId: user.id,
				lessonId: resourceId,
			})

			if (progress?.completedAt) {
				await sendInngestProgressEvent({
					user: user,
					lessonId: resourceId,
				})
			}
			return resourceProgressSchema.parse(progress)
		}
	} catch (error) {
		console.error(error)
		let message = 'Unknown Error'
		if (error instanceof Error) message = error.message
		return null
	}
}

export async function sendInngestProgressEvent({
	user,
	lessonId,
	lessonSlug,
}: {
	user: any
	lessonId: string
	lessonSlug?: string
}) {
	// TODO: execute a function that will email after a debounce to encourage
	await inngest.send({
		name: LESSON_COMPLETED_EVENT,
		data: {
			lessonId: lessonId,
		},
		user,
	})
}

export async function getModuleProgressForUser(
	moduleIdOrSlug: string,
): Promise<ModuleProgress | null> {
	const { session } = await getServerAuthSession()
	if (session.user) {
		const moduleProgress = await courseBuilderAdapter.getModuleProgressForUser(
			session.user.id,
			moduleIdOrSlug,
		)
		return moduleProgress
	}

	const subscriberCookie = cookies().get('ck_subscriber')

	if (!subscriberCookie) {
		console.error('no subscriber cookie')
		return {
			completedLessons: [],
			nextResource: null,
			percentCompleted: 0,
			completedLessonsCount: 0,
			totalLessonsCount: 0,
		}
	}

	const subscriber = SubscriberSchema.parse(JSON.parse(subscriberCookie.value))

	if (!subscriber?.email_address) {
		console.error('no subscriber cookie')
		return {
			completedLessons: [],
			nextResource: null,
			percentCompleted: 0,
			completedLessonsCount: 0,
			totalLessonsCount: 0,
		}
	}
	const moduleProgress = await courseBuilderAdapter.getModuleProgressForUser(
		subscriber.email_address,
		moduleIdOrSlug,
	)
	return moduleProgress
}
