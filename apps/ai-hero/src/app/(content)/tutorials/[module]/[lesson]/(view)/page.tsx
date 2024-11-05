import * as React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import { getLesson } from '@/lib/lessons-query'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'

import { LessonPageWrapper } from './shared-page'

export type Props = {
	params: Promise<{ lesson: string; module: string }>
}

export async function generateMetadata(
	props: Props,
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

export default async function Page(props: {
	params: Promise<{ lesson: string; module: string }>
}) {
	const params = await props.params
	return <LessonPageWrapper params={params} />
}
