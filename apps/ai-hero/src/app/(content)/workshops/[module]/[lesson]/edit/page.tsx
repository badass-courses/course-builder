import * as React from 'react'
import { notFound } from 'next/navigation'
import { EditLessonForm } from '@/app/(content)/_components/edit-lesson-form'
import { getLesson, getVideoResourceForLesson } from '@/lib/lessons-query'
import { getServerAuthSession } from '@/server/auth'

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
		<EditLessonForm
			key={lesson.id}
			lesson={lesson}
			videoResource={videoResource}
			moduleType="workshop"
		/>
	)
}
