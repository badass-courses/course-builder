import * as React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import { LessonProvider } from '@/app/(content)/tutorials/[module]/[lesson]/_components/lesson-context'
import { ModuleProvider } from '@/app/(content)/tutorials/[module]/[lesson]/_components/module-context'
import { LessonPage } from '@/app/(content)/workshops/[module]/[lesson]/(view)/shared-page'
import { getLesson } from '@/lib/lessons-query'
import { getModuleProgressForUser } from '@/lib/progress'
import { getWorkshop } from '@/lib/workshops-query'
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
	const moduleLoader = getWorkshop(params.module)
	const lessonLoader = getLesson(params.lesson)
	const moduleProgressLoader = getModuleProgressForUser(params.module)

	return (
		<ModuleProvider moduleLoader={moduleLoader}>
			<LessonProvider lessonLoader={lessonLoader}>
				<LessonPage
					lessonLoader={lessonLoader}
					moduleLoader={moduleLoader}
					moduleProgressLoader={moduleProgressLoader}
					searchParams={searchParams}
				/>
			</LessonProvider>
		</ModuleProvider>
	)
}
