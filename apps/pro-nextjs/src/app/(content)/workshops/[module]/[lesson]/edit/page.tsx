import * as React from 'react'
import { notFound } from 'next/navigation'
import { getLesson } from '@/lib/lessons-query'
import { getServerAuthSession } from '@/server/auth'

import { EditLessonForm } from './_components/edit-lesson-form'

export default async function LessonEditPage({
	params,
}: {
	params: { lesson: string }
}) {
	const { ability } = await getServerAuthSession()
	const lesson = await getLesson(params.lesson)

	if (!lesson || !ability.can('create', 'Content')) {
		notFound()
	}

	return <EditLessonForm key={lesson.id} lesson={lesson} />
}
