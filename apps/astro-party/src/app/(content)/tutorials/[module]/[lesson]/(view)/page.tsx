import * as React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import { getLesson } from '@/lib/lessons-query'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'

import { LessonPageWrapper } from './shared-page'

export type Props = {
	params: { lesson: string; module: string }
}

export async function generateMetadata(
	{ params }: Props,
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

export default async function Page({
	params,
}: {
	params: { lesson: string; module: string }
}) {
	return <LessonPageWrapper params={params} />
}
