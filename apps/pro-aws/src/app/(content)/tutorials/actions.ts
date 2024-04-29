'use server'

import { revalidatePath } from 'next/cache'
import { courseBuilderAdapter } from '@/db'
import { getNextResource } from '@/lib/resources/get-next-resource'
import { getServerAuthSession } from '@/server/auth'

export async function completeLesson(formData: { resourceId: string }) {
	const { session } = await getServerAuthSession()

	if (!session) {
		throw new Error('Unauthorized')
	}

	return await courseBuilderAdapter.completeLessonProgressForUser({
		userId: session.user.id,
		lessonId: formData.resourceId,
	})
}

export async function getNextLesson({ resourceId }: { resourceId: string }) {
	const nextLesson = await getNextResource(resourceId)

	return { nextLesson }
}

export async function revalidateTutorialLesson(
	moduleSlug: string,
	lessonSlug: string,
) {
	return revalidatePath(`/tutorials/${moduleSlug}/${lessonSlug}`)
}
