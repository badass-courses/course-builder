import { notFound } from 'next/navigation'
import { EditSolutionForm } from '@/app/(content)/workshops/_components/edit-solution-form'
import LayoutClient from '@/components/layout-client'
import { getLesson } from '@/lib/lessons-query'
import {
	getSolutionForLesson,
	getVideoResourceForSolution,
} from '@/lib/solutions-query'
import { getServerAuthSession } from '@/server/auth'
import { log } from '@/server/logger'
import { guid } from '@/utils/guid'

/**
 * Solution edit page
 * Allows creating or editing a solution for a lesson
 * Only fetches video resource if user has required permissions
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

	// Get the solution for this lesson if it exists
	const solution = await getSolutionForLesson(lessonData.id)

	// If solution doesn't exist, prepare a default slug
	const defaultSlug = solution
		? solution.fields.slug
		: `${lessonData.fields.slug}-solution~${guid()}`

	// Only fetch video resource if user has permission to view content
	let videoResource = null
	if (solution) {
		try {
			videoResource = await getVideoResourceForSolution(solution.id)
		} catch (error) {
			log.error('solutionEditPage.getVideoResource.error', {
				error,
				solutionId: solution.id,
			})
		}
	}

	return (
		<LayoutClient>
			<EditSolutionForm
				key={solution?.id || `new-solution-${lessonData.id}`}
				solution={solution}
				lessonId={lessonData.id}
				defaultSlug={defaultSlug}
				videoResource={videoResource}
			/>
		</LayoutClient>
	)
}
