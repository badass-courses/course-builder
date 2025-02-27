import * as React from 'react'
import { notFound } from 'next/navigation'
import { getLesson } from '@/lib/lessons-query'
import { getSolutionForLesson } from '@/lib/solutions-query'
import { getServerAuthSession } from '@/server/auth'
import ReactMarkdown from 'react-markdown'

/**
 * Solution content view page
 * Displays a solution for a lesson with formatting
 * This is a simpler version that shows just the solution content
 */
export default async function SolutionContentViewPage({
	params,
}: {
	params: { module: string; lesson: string }
}) {
	const { lesson: lessonSlug } = params
	const { ability } = await getServerAuthSession()

	// Get the lesson first
	const lesson = await getLesson(lessonSlug)
	if (!lesson) {
		notFound()
	}

	// Get the solution for this lesson
	const solution = await getSolutionForLesson(lesson.id)
	if (!solution) {
		notFound()
	}

	// Check if user can access the solution based on visibility
	if (
		solution.fields.visibility === 'private' &&
		!ability.can('read', 'Content')
	) {
		notFound()
	}

	return (
		<div className="container py-10">
			<h1 className="mb-6 text-3xl font-bold">{solution.fields.title}</h1>

			{solution.fields.description && (
				<div className="text-muted-foreground bg-muted mb-8 rounded-md p-4">
					<p className="italic">{solution.fields.description}</p>
				</div>
			)}

			<div className="prose dark:prose-invert max-w-none">
				<ReactMarkdown>{solution.fields.body || ''}</ReactMarkdown>
			</div>
		</div>
	)
}
