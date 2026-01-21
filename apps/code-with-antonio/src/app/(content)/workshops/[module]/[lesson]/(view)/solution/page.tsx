import * as React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import { notFound } from 'next/navigation'
import { LessonProvider } from '@/app/(content)/tutorials/[module]/[lesson]/_components/lesson-context'
import { LessonPage } from '@/app/(content)/workshops/[module]/[lesson]/(view)/shared-page'
import {
	getCachedExerciseSolution,
	getExerciseSolution,
	getLesson,
} from '@/lib/lessons-query'
import { getCachedMinimalWorkshop } from '@/lib/workshops-query'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'

export async function generateMetadata(
	props: {
		params: Promise<{
			module: string
			lesson: string
		}>
	},
	parent: ResolvingMetadata,
): Promise<Metadata> {
	const params = await props.params
	const lesson = await getLesson(params.lesson)

	if (!lesson) {
		return parent as Metadata
	}

	return {
		title: lesson.fields?.title,
		openGraph: {
			images: [getOGImageUrlForResource(lesson)],
		},
	}
}

export default async function LessonSolutionPage(props: {
	params: Promise<{
		module: string
		lesson: string
	}>
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
	const searchParams = await props.searchParams
	const params = await props.params

	// Parallelize solution and workshop fetches
	const [data, workshop] = await Promise.all([
		getCachedExerciseSolution(params.lesson),
		getCachedMinimalWorkshop(params.module),
	])

	if (!data) {
		notFound()
	}

	const { solution, lesson } = data

	return (
		<LessonProvider lesson={solution}>
			<LessonPage
				searchParams={searchParams}
				lesson={solution}
				problem={lesson}
				params={params}
				workshop={workshop}
			/>
		</LessonProvider>
	)
}
