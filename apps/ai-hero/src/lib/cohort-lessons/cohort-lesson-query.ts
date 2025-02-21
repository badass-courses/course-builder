'use server'

import { courseBuilderAdapter, db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import { log } from '@/server/logger'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'
import { and, eq, sql } from 'drizzle-orm'

import { CohortLessonSchema } from './cohort-lesson'
import type {
	CohortLesson,
	CreateCohortLessonInput,
	UpdateCohortLessonInput,
} from './cohort-lesson'

import 'server-only'

import { getServerAuthSession } from '@/server/auth'

import { ContentResourceSchema } from '@coursebuilder/core/schemas'

import { Post, PostSchema } from '../posts'

/**
 * Get a cohort lesson by its ID
 */
export async function getCohortLesson(
	id: string,
): Promise<CohortLesson | null> {
	const lesson = await db.query.contentResource.findFirst({
		where: sql`
			${contentResource.id} = ${id} AND
			JSON_EXTRACT(${contentResource.fields}, "$.postType") = 'cohort-lesson'
		`,
	})

	if (!lesson) return null

	const parsed = CohortLessonSchema.safeParse(lesson)
	if (!parsed.success) {
		log.error('invalid_cohort_lesson_data', {
			lessonId: id,
			error: parsed.error,
		})
		return null
	}

	return parsed.data
}

/**
 * Get all lessons for a specific cohort using the join table
 */
export async function getCohortLessons(
	cohortId: string,
): Promise<CohortLesson[]> {
	const query = sql`SELECT cr_lesson.*
		FROM ${contentResource} AS cr_cohort
		JOIN ${contentResourceResource} AS crr ON cr_cohort.id = crr.resourceOfId
		JOIN ${contentResource} AS cr_lesson ON crr.resourceId = cr_lesson.id
		WHERE (cr_cohort.id = ${cohortId} OR JSON_UNQUOTE(JSON_EXTRACT(cr_cohort.fields, '$.slug')) = ${cohortId})
			AND JSON_EXTRACT(cr_lesson.fields, "$.postType") = 'cohort-lesson'
		ORDER BY crr.position;`

	const result = await db.execute(query)

	return result.rows
		.map((row) => CohortLessonSchema.safeParse(row))
		.filter(
			(result): result is { success: true; data: CohortLesson } =>
				result.success,
		)
		.map((result) => result.data)
}

/**
 * Get the parent cohort for a lesson using the join table
 */
export async function getParentCohort(lessonId: string): Promise<Post | null> {
	const query = sql`SELECT cr_cohort.*
		FROM ${contentResource} AS cr_lesson
		JOIN ${contentResourceResource} AS crr ON cr_lesson.id = crr.resourceId
		JOIN ${contentResource} AS cr_cohort ON crr.resourceOfId = cr_cohort.id
		WHERE (cr_lesson.id = ${lessonId} OR JSON_UNQUOTE(JSON_EXTRACT(cr_lesson.fields, '$.slug')) = ${lessonId})
			AND JSON_EXTRACT(cr_cohort.fields, "$.postType") = 'cohort'
		LIMIT 1;`

	const result = await db.execute(query)

	if (!result.rows.length) return null

	const cohortResourceRow = ContentResourceSchema.parse(result.rows[0])

	return PostSchema.parse(cohortResourceRow)
}

/**
 * Create a new cohort lesson and establish the relationship in the join table
 */
export async function createCohortLesson(
	input: CreateCohortLessonInput,
): Promise<CohortLesson> {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user

	if (!user || !ability.can('create', 'Content')) {
		throw new Error('Unauthorized')
	}

	// Check if cohort exists
	const cohort = await db.query.contentResource.findFirst({
		where: sql`
			${contentResource.id} = ${input.cohortId} AND
			JSON_EXTRACT(${contentResource.fields}, "$.postType") = 'cohort'
		`,
	})

	if (!cohort) {
		throw new Error('Parent cohort not found')
	}

	const lessonGuid = guid()
	const newLessonId = `lesson_${lessonGuid}`

	const lesson = await courseBuilderAdapter.createContentResource({
		id: newLessonId,
		type: 'post',
		fields: {
			title: input.title,
			postType: 'cohort-lesson',
			state: 'draft',
			visibility: 'unlisted',
			slug: `${slugify(input.title)}~${guid()}`,
			position: input.position,
		},
		createdById: input.createdById || '',
	})

	if (!lesson) {
		throw new Error('Failed to create cohort lesson')
	}

	// Create the relationship in the join table
	await db.insert(contentResourceResource).values({
		resourceOfId: input.cohortId,
		resourceId: newLessonId,
		position: input.position || 0,
	})

	const parsed = CohortLessonSchema.safeParse(lesson)
	if (!parsed.success) {
		log.error('invalid_cohort_lesson_data', {
			lessonId: lesson.id,
			error: parsed.error,
		})
		throw new Error('Created cohort lesson failed validation')
	}

	log.info('cohort_lesson_created', {
		lessonId: lesson.id,
		cohortId: input.cohortId,
	})

	return parsed.data
}

/**
 * Update an existing cohort lesson
 */
export async function updateCohortLesson(
	id: string,
	input: UpdateCohortLessonInput,
): Promise<CohortLesson> {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user

	if (!user || !ability.can('update', 'Content')) {
		throw new Error('Unauthorized')
	}

	const lesson = await courseBuilderAdapter.updateContentResourceFields({
		id,
		fields: input.fields,
	})

	if (!lesson) {
		throw new Error('Failed to update cohort lesson')
	}

	const parsed = CohortLessonSchema.safeParse(lesson)
	if (!parsed.success) {
		log.error('invalid_cohort_lesson_data', {
			lessonId: id,
			error: parsed.error,
		})
		throw new Error('Updated cohort lesson failed validation')
	}

	log.info('cohort_lesson_updated', {
		lessonId: lesson.id,
	})

	return parsed.data
}

/**
 * Delete a cohort lesson
 */
export async function deleteCohortLesson(id: string): Promise<void> {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user

	if (!user || !ability.can('delete', 'Content')) {
		throw new Error('Unauthorized')
	}

	const lesson = await getCohortLesson(id)
	if (!lesson) {
		throw new Error('Cohort lesson not found')
	}

	// The courseBuilderAdapter.deleteContentResource will handle cleaning up the join table
	if (!user || !ability.can('delete', 'Content')) {
		throw new Error('Unauthorized')
	}
	await db.delete(contentResource).where(eq(contentResource.id, id))

	log.info('cohort_lesson_deleted', {
		lessonId: id,
	})
}
