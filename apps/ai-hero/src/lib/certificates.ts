import { db } from '@/db'
import {
	contentResource,
	contentResourceResource,
	resourceProgress,
} from '@/db/schema'
import { sql } from 'drizzle-orm'

import { getAllWorkshopsInCohort } from './cohorts-query'
import type { Workshop } from './workshops'

export async function checkCertificateEligibility(
	resourceId: string,
	userId: string,
) {
	if (!userId) {
		return { hasCompletedModule: false }
	}

	const { completed: hasCompletedModule, lastCompletedDate } =
		await hasUserCompletedAllLessons(userId, resourceId)

	return { hasCompletedModule, date: lastCompletedDate }
}

export async function checkCohortCertificateEligibilityFromWorkshops(
	workshops: Workshop[],
	userId?: string,
) {
	if (!userId) {
		return { hasCompletedCohort: false, date: null }
	}

	if (!workshops || workshops.length === 0) {
		return { hasCompletedCohort: false, date: null }
	}

	const moduleCompletionPromises = workshops.map((module) =>
		hasUserCompletedAllLessons(userId, module.id),
	)

	const moduleCompletionResults = await Promise.all(moduleCompletionPromises)
	const allModulesCompleted = moduleCompletionResults.every(
		(result) => result.completed,
	)

	if (!allModulesCompleted) {
		return { hasCompletedCohort: false, date: null }
	}

	const completionDates = moduleCompletionResults
		.map((result) => result.lastCompletedDate)
		.filter((date): date is Date => date !== null)

	let latestCompletionDate: Date | null = null
	if (completionDates.length > 0) {
		latestCompletionDate = new Date(
			Math.max(...completionDates.map((date) => date.getTime())),
		)
	}

	return {
		hasCompletedCohort: allModulesCompleted,
		date: latestCompletionDate,
	}
}

export async function checkCohortCertificateEligibility(
	cohortId: string,
	userId?: string,
) {
	if (!userId) {
		return { hasCompletedCohort: false, date: null }
	}
	try {
		const modules = await getAllWorkshopsInCohort(cohortId)

		if (!modules || modules.length === 0) {
			return { hasCompletedCohort: false, date: null }
		}

		const moduleCompletionPromises = modules.map((module) =>
			hasUserCompletedAllLessons(userId, module.id),
		)

		const moduleCompletionResults = await Promise.all(moduleCompletionPromises)
		const allModulesCompleted = moduleCompletionResults.every(
			(result) => result.completed,
		)

		if (!allModulesCompleted) {
			return { hasCompletedCohort: false, date: null }
		}

		const completionDates = moduleCompletionResults
			.map((result) => result.lastCompletedDate)
			.filter((date): date is Date => date !== null)

		let latestCompletionDate: Date | null = null
		if (completionDates.length > 0) {
			latestCompletionDate = new Date(
				Math.max(...completionDates.map((date) => date.getTime())),
			)
		}

		return {
			hasCompletedCohort: allModulesCompleted,
			date: latestCompletionDate,
		}
	} catch (error) {
		console.error(error)
		return { hasCompletedCohort: false, date: null }
	}
}

async function hasUserCompletedAllLessons(
	userId: string,
	resourceId: string,
): Promise<{ completed: boolean; lastCompletedDate: Date | null }> {
	// Execute the optimized query to check if there are any incomplete lessons
	const results: any = await db.execute(sql`
	SELECT
		COUNT(CASE WHEN rp.completedAt IS NULL THEN 1 END) AS incomplete_lessons,
		MAX(rp.completedAt) AS last_completed_date
	FROM ${contentResource} cr
	LEFT JOIN ${resourceProgress} rp ON rp.resourceId = cr.id AND rp.userId = ${userId}
	WHERE cr.id IN (
			SELECT cr.id
			FROM ${contentResource} cr
			WHERE cr.id IN (
					SELECT crr.resourceId
					FROM ${contentResourceResource} crr
					WHERE crr.resourceOfId = (
							SELECT id
							FROM ${contentResource}
							WHERE id = ${resourceId} OR fields->>'$.slug' = ${resourceId}
					)
			)
			OR cr.id IN (
					SELECT crr.resourceId
					FROM ${contentResourceResource} crr
					WHERE crr.resourceOfId IN (
							SELECT crr.resourceId
							FROM ${contentResourceResource} crr
							WHERE crr.resourceOfId = (
									SELECT id
									FROM ${contentResource}
									WHERE id = ${resourceId} OR fields->>'$.slug' = ${resourceId}
							)
					)
			)
	)
	AND cr.type IN ('lesson', 'exercise')
	AND (cr.fields->>'$.optional' IS NULL OR cr.fields->>'$.optional' = 'false')
`)

	const incompleteLessons = Number(results.rows[0]?.incomplete_lessons) || 0
	const lastCompletedDate = results.rows[0]?.last_completed_date
		? new Date(results.rows[0].last_completed_date)
		: null

	// If there are no incomplete lessons, the user has completed all lessons
	const completed = incompleteLessons === 0

	return { completed, lastCompletedDate }
}
