'use server'

import { courseBuilderAdapter, db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import { LessonSchema } from '@/lib/lessons'
import type { TipUpdate } from '@/lib/tips'
import { getTip } from '@/lib/tips-query'
import { getServerAuthSession } from '@/server/auth'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'
import { and, asc, eq, like, or, sql } from 'drizzle-orm'
import { last } from 'lodash'

import { VideoResource } from '@coursebuilder/core/schemas/video-resource'

export const addVideoResourceToLesson = async ({
	videoResourceId,
	lessonId,
}: {
	videoResourceId: string
	lessonId: string
}) => {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user

	console.log('addVideoResourceToLesson', { videoResourceId, lessonId })

	if (!user || !ability.can('create', 'Content')) {
		throw new Error('Unauthorized')
	}

	const videoResource = await db.query.contentResource.findFirst({
		where: and(
			eq(contentResource.id, videoResourceId),
			eq(contentResource.type, 'videoResource'),
		),
		with: {
			resources: true,
		},
	})

	console.log('videoResource', videoResource)

	const lesson = await db.query.contentResource.findFirst({
		where: and(
			like(contentResource.id, `%${last(lessonId.split('-'))}%`),
			eq(contentResource.type, 'lesson'),
		),
		with: {
			resources: true,
		},
	})

	console.log('lesson', lesson)

	if (!lesson) {
		throw new Error(`Lesson with id ${lessonId} not found`)
	}

	if (!videoResource) {
		throw new Error(`Video Resource with id ${videoResourceId} not found`)
	}

	await db.insert(contentResourceResource).values({
		resourceOfId: lesson.id,
		resourceId: videoResource.id,
		position: lesson.resources.length,
	})

	return db.query.contentResourceResource.findFirst({
		where: and(
			eq(contentResourceResource.resourceOfId, lesson.id),
			eq(contentResourceResource.resourceId, videoResource.id),
		),
		with: {
			resource: true,
		},
	})
}

export async function getLesson(lessonSlugOrId: string) {
	const lesson = await db.query.contentResource.findFirst({
		where: and(
			or(
				eq(
					sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`,
					lessonSlugOrId,
				),
				eq(contentResource.id, lessonSlugOrId),
			),
			eq(contentResource.type, 'lesson'),
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

	const parsedLesson = LessonSchema.safeParse(lesson)
	if (!parsedLesson.success) {
		console.error('Error parsing lesson', lesson)
		return null
	}

	return parsedLesson.data
}

export async function updateLesson(input: TipUpdate) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user
	if (!user || !ability.can('update', 'Content')) {
		throw new Error('Unauthorized')
	}

	const currentLesson = await getLesson(input.id)

	if (!currentLesson) {
		throw new Error(`Tip with id ${input.id} not found.`)
	}

	let lessonSlug = currentLesson.fields.slug

	if (input.fields.title !== currentLesson.fields.title) {
		const splitSlug = currentLesson?.fields.slug.split('~') || ['', guid()]
		lessonSlug = `${slugify(input.fields.title)}~${splitSlug[1] || guid()}`
	}

	return courseBuilderAdapter.updateContentResourceFields({
		id: currentLesson.id,
		fields: {
			...currentLesson.fields,
			...input.fields,
			slug: lessonSlug,
		},
	})
}
