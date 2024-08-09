import * as React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import { LessonProvider } from '@/app/(content)/tutorials/[module]/[lesson]/_components/lesson-context'
import { LessonPage } from '@/app/(content)/workshops/[module]/[lesson]/(view)/shared-page'
import { getExerciseSolution, getLesson } from '@/lib/lessons-query'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'

export async function generateMetadata(
	{
		params,
	}: {
		params: {
			module: string
			lesson: string
		}
	},
	parent: ResolvingMetadata,
): Promise<Metadata> {
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

export default async function LessonSolutionPage({
	params,
	searchParams,
}: {
	params: {
		module: string
		lesson: string
	}
	searchParams: { [key: string]: string | string[] | undefined }
}) {
	const lesson = await getExerciseSolution(params.lesson)

	return (
		<LessonProvider lesson={lesson}>
			<LessonPage searchParams={searchParams} lesson={lesson} params={params} />
		</LessonProvider>
	)
}
