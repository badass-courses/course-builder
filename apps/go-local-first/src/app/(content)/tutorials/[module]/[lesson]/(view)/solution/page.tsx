import type { Metadata, ResolvingMetadata } from 'next'
import { getLesson } from '@/lib/lessons-query'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'

import { LessonPageWrapper } from '../shared-page'

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

export default async function LessonPage(props: {
	params: Promise<{
		module: string
		lesson: string
	}>
}) {
	const params = await props.params
	return <LessonPageWrapper params={params} lessonPageType="solution" />
}
