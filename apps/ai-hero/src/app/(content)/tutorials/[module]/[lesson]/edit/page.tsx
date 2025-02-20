import * as React from 'react'
import { notFound } from 'next/navigation'
import { EditWorkshopLessonForm } from '@/app/(content)/workshops/_components/edit-workshop-lesson-form'
import { getLesson, getVideoResourceForLesson } from '@/lib/lessons-query'
import { getServerAuthSession } from '@/server/auth'

export const dynamic = 'force-dynamic'

export default async function LessonEditPage(props: {
	params: Promise<{ lesson: string }>
}) {
	const params = await props.params
	const { ability } = await getServerAuthSession()
	const lesson = await getLesson(params.lesson)

	if (!lesson || !ability.can('create', 'Content')) {
		notFound()
	}

	const videoResource = await getVideoResourceForLesson(params.lesson)

	return (
		<EditWorkshopLessonForm
			key={lesson.id}
			lesson={lesson}
			videoResource={videoResource}
			moduleType="tutorial"
		/>
	)
}
