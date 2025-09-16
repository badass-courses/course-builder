import type { AppAbility } from '@/ability'
import { subject } from '@casl/ability'

import { getLesson } from '../lessons/lessons.service'
import type { NewSolutionInput, SolutionUpdate } from '../solution'
import {
	deleteSolutionFromDatabase,
	getSolutionForLesson as getSolutionForLessonQuery,
	writeNewSolutionToDatabase,
	writeSolutionUpdateToDatabase,
} from '../solutions-query'

export class SolutionError extends Error {
	constructor(
		message: string,
		public statusCode: number = 400,
		public details?: unknown,
	) {
		super(message)
	}
}

export async function getSolutionForLesson(
	lessonId: string,
	ability: AppAbility,
) {
	const lesson = await getLesson(lessonId, ability)
	if (!lesson) {
		console.log('❌ Lesson not found:', lessonId)
		throw new SolutionError('Lesson not found', 404)
	}

	if (ability.cannot('read', subject('Content', lesson))) {
		console.log('❌ User lacks permission to read lesson:', lessonId)
		throw new SolutionError('Unauthorized', 401)
	}

	const solution = await getSolutionForLessonQuery(lesson.id)

	if (!solution) {
		console.log('❌ Solution not found:', lessonId)
		throw new SolutionError('Solution not found', 404)
	}

	return solution
}

export async function updateSolutionForLesson(
	lessonId: string,
	ability: AppAbility,
	data: SolutionUpdate,
	userId: string,
) {
	const lesson = await getLesson(lessonId, ability)
	if (!lesson) {
		console.log('❌ Lesson not found:', lessonId)
		throw new SolutionError('Lesson not found', 404)
	}

	console.log('🔐 Checking permissions')
	if (ability.cannot('manage', subject('Content', lesson))) {
		console.error('❌ User lacks permission:', {
			userId,
			lessonId,
			action: 'update',
		})
		throw new SolutionError('Unauthorized', 401)
	}

	const solution = await getSolutionForLessonQuery(lessonId)
	if (!solution) {
		console.log('❌ Solution not found:', lessonId)
		throw new SolutionError('Solution not found', 404)
	}

	const updatedSolution = await writeSolutionUpdateToDatabase({
		...data,
		id: solution.id,
	})

	return updatedSolution
}

export async function createSolutionForLesson(
	lessonId: string,
	ability: AppAbility,
	data: NewSolutionInput,
	userId: string,
) {
	const lesson = await getLesson(lessonId, ability)

	if (!lesson) {
		console.log('❌ Lesson not found:', lessonId)
		throw new SolutionError('Lesson not found', 404)
	}

	if (ability.cannot('manage', subject('Content', lesson))) {
		console.error('❌ User lacks permission:', {
			userId,
			lessonId: lesson.id,
			action: 'create',
		})
		throw new SolutionError('Unauthorized', 401)
	}

	const existingSolution = await getSolutionForLessonQuery(lesson.id)

	if (existingSolution) {
		console.log('❌ Solution already exists:', lesson.id)
		throw new SolutionError('Solution already exists', 400)
	}

	const solution = await writeNewSolutionToDatabase({
		...data,
		parentLessonId: lesson.id,
		createdById: userId,
	})

	return solution
}

export async function deleteSolutionForLesson(
	lessonId: string,
	ability: AppAbility,
	userId: string,
) {
	const lesson = await getLesson(lessonId, ability)
	if (!lesson) {
		console.log('❌ Lesson not found:', lessonId)
		throw new SolutionError('Lesson not found', 404)
	}

	if (ability.cannot('manage', subject('Content', lesson))) {
		console.error('❌ User lacks permission:', {
			userId,
			lessonId: lesson.id,
			action: 'delete',
		})
		throw new SolutionError('Unauthorized', 401)
	}

	const solution = await getSolutionForLessonQuery(lesson.id)

	if (!solution) {
		console.log('❌ Solution not found:', lesson.id)
		throw new SolutionError('Solution not found', 404)
	}

	await deleteSolutionFromDatabase(solution.id)

	return { message: 'Solution deleted' }
}
