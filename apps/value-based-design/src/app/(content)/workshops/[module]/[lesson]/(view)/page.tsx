import * as React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import { LessonPage } from '@/app/(content)/workshops/[module]/[lesson]/(view)/shared-page'
import { getLesson } from '@/lib/lessons-query'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'

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

type Props = {
	params: { lesson: string; module: string }
	searchParams: { [key: string]: string | string[] | undefined }
}

export default async function LessonPageWrapper({
	params,
	searchParams,
}: Props) {
	const lesson = await getLesson(params.lesson)

	return (
		<LessonPage params={params} lesson={lesson} searchParams={searchParams} />
	)
}
