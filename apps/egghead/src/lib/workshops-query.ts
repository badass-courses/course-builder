'use server'

import 'server-only'

import { unstable_cache } from 'next/cache'
import { db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import { Post, PostSchema } from '@/lib/posts'
import { getServerAuthSession } from '@/server/auth'
import { and, asc, eq, sql } from 'drizzle-orm'

import { ContentResourceSchema } from '@coursebuilder/core/schemas'

/**
 * Get all workshops/courses for the current user
 */
export async function getWorkshops() {
	const { session } = await getServerAuthSession()
	const userId = session?.user?.id

	if (!userId) {
		return []
	}

	const workshops = await db.query.contentResource.findMany({
		where: and(
			eq(contentResource.type, 'post'),
			sql`JSON_EXTRACT(${contentResource.fields}, '$.postType') = 'course'`,
			eq(contentResource.createdById, userId),
		),
		orderBy: [asc(sql`JSON_EXTRACT(${contentResource.fields}, '$.title')`)],
	})

	return ContentResourceSchema.array().parse(workshops)
}

/**
 * Get cached workshops for performance
 */
export const getCachedWorkshops = unstable_cache(
	async () => getWorkshops(),
	['workshops'],
	{ revalidate: 3600, tags: ['workshops', 'posts'] },
)

/**
 * Get a workshop/course with its lessons
 */
export async function getWorkshopWithLessons(courseSlug: string): Promise<{
	course: Post
	lessons: Post[]
} | null> {
	// Get the course
	const courseData = await db.query.contentResource.findFirst({
		where: and(
			eq(sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`, courseSlug),
			eq(contentResource.type, 'post'),
			sql`JSON_EXTRACT(${contentResource.fields}, '$.postType') = 'course'`,
		),
		with: {
			resources: {
				with: {
					resource: true,
				},
				orderBy: asc(contentResourceResource.position),
			},
		},
	})

	if (!courseData) {
		return null
	}

	const course = PostSchema.parse(courseData)

	// Get all lessons that belong to this course
	const lessonIds =
		courseData.resources
			?.map((r) => r.resource)
			?.filter((resource) => {
				const fields = resource.fields as any
				return fields?.postType === 'lesson'
			})
			?.map((resource) => resource.id) || []

	const lessonsData =
		lessonIds.length > 0
			? await db.query.contentResource.findMany({
					where: and(
						eq(contentResource.type, 'post'),
						sql`${contentResource.id} IN (${lessonIds.join(',')})`,
					),
					orderBy: [
						asc(sql`JSON_EXTRACT(${contentResource.fields}, '$.title')`),
					],
				})
			: []

	const lessons = lessonsData.map((lesson) => PostSchema.parse(lesson))

	return {
		course,
		lessons,
	}
}

/**
 * Get cached workshop with lessons
 */
export const getCachedWorkshopWithLessons = unstable_cache(
	async (courseSlug: string) => getWorkshopWithLessons(courseSlug),
	['workshop-with-lessons'],
	{ revalidate: 3600, tags: ['workshops', 'posts'] },
)

/**
 * Get a lesson with its parent course context
 */
export async function getLessonWithCourse(
	courseSlug: string,
	lessonSlug: string,
): Promise<{
	course: Post
	lesson: Post
	lessons: Post[]
} | null> {
	const workshopData = await getWorkshopWithLessons(courseSlug)

	if (!workshopData) {
		return null
	}

	// Find the specific lesson
	const lesson = workshopData.lessons.find((l) => l.fields?.slug === lessonSlug)

	if (!lesson) {
		return null
	}

	return {
		course: workshopData.course,
		lesson,
		lessons: workshopData.lessons,
	}
}

/**
 * Get cached lesson with course context
 */
export const getCachedLessonWithCourse = unstable_cache(
	async (courseSlug: string, lessonSlug: string) =>
		getLessonWithCourse(courseSlug, lessonSlug),
	['lesson-with-course'],
	{ revalidate: 3600, tags: ['workshops', 'posts'] },
)

/**
 * Get lessons for a course (for navigation)
 */
export async function getCourseLessons(courseSlug: string): Promise<Post[]> {
	const workshopData = await getWorkshopWithLessons(courseSlug)
	return workshopData?.lessons || []
}

/**
 * Get cached course lessons
 */
export const getCachedCourseLessons = unstable_cache(
	async (courseSlug: string) => getCourseLessons(courseSlug),
	['course-lessons'],
	{ revalidate: 3600, tags: ['workshops', 'posts'] },
)
