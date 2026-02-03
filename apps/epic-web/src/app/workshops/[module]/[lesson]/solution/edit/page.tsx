import { notFound } from 'next/navigation'
import { EditSolutionForm } from '@/app/workshops/_components/edit-solution-form'
import { getLesson } from '@/lib/lessons-query'
import {
	createSolution,
	getSolutionForLesson,
	getVideoResourceForSolution,
} from '@/lib/solutions-query'
import { getServerAuthSession } from '@/server/auth'
import { log } from '@/server/logger'
import { guid } from '@/utils/guid'

/**
 * Solution edit page
 * Allows creating or editing a solution for a lesson
 * Creates the solution on first visit if it doesn't exist
 */
export default async function SolutionEditPage({
	params,
}: {
	params: Promise<{ module: string; lesson: string }>
}) {
	const { module, lesson } = await params
	const { ability } = await getServerAuthSession()

	if (!ability.can('create', 'Content')) {
		notFound()
	}

	// Get the lesson first to ensure it exists
	const lessonData = await getLesson(lesson)
	if (!lessonData) {
		notFound()
	}

	// Get the solution for this lesson, or create one if it doesn't exist
	let solution = await getSolutionForLesson(lessonData.id)

	if (!solution) {
		// Create the solution immediately so we have an ID for socket connections
		const defaultSlug = `${lessonData.fields.slug}-solution~${guid()}`
		const newSolution = await createSolution({
			lessonId: lessonData.id,
			title: `${lessonData.fields.title} - Solution`,
			slug: defaultSlug,
		})
		// Re-fetch to get the properly parsed solution with all fields
		solution = await getSolutionForLesson(lessonData.id)
	}

	if (!solution) {
		// This shouldn't happen, but handle it gracefully
		log.error('solutionEditPage.createSolution.failed', {
			lessonId: lessonData.id,
		})
		notFound()
	}

	// Fetch video resource for the solution
	let videoResource = null
	try {
		videoResource = await getVideoResourceForSolution(solution.id)
	} catch (error) {
		log.error('solutionEditPage.getVideoResource.error', {
			error,
			solutionId: solution.id,
		})
	}

	return (
		<EditSolutionForm
			key={solution.id}
			solution={solution}
			lessonId={lessonData.id}
			videoResource={videoResource}
		/>
	)
}
