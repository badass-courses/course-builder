import * as React from 'react'
import { notFound } from 'next/navigation'
import { EditSolutionForm } from '@/app/(content)/workshops/_components/edit-solution-form'
import { getLesson } from '@/lib/lessons-query'
import { getSolutionForLesson } from '@/lib/solutions-query'
import { getServerAuthSession } from '@/server/auth'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'

/**
 * Solution edit page
 * Allows creating or editing a solution for a lesson
 */
export default async function SolutionEditPage({
	params,
}: {
	params: { module: string; lesson: string }
}) {
	const { module, lesson } = params
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

	return (
		<EditSolutionForm
			key={solution?.id || `new-solution-${lessonData.id}`}
			solution={solution}
			lessonId={lessonData.id}
			defaultSlug={defaultSlug}
		/>
	)
}
