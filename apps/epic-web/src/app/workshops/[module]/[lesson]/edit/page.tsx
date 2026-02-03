import * as React from 'react'
import { notFound } from 'next/navigation'
import LayoutClient from '@/components/layout-client'
import { getLesson, getVideoResourceForLesson } from '@/lib/lessons-query'
import { getServerAuthSession } from '@/server/auth'
import { log } from '@/server/logger'

import { EditWorkshopLessonForm } from '../../../_components/edit-workshop-lesson-form'

/**
 * Page component for editing a workshop lesson
 * Fetches the lesson and video resource (if authorized)
 */
export default async function LessonEditPage(props: {
	params: Promise<{ lesson: string }>
}) {
	const params = await props.params
	const { ability } = await getServerAuthSession()
	const lesson = await getLesson(params.lesson)

	if (!lesson || !ability.can('create', 'Content')) {
		notFound()
	}

	// Only fetch video resource if user has permission to view content
	let videoResource = null
	try {
		videoResource = await getVideoResourceForLesson(params.lesson)
	} catch (error) {
		log.error('lessonEditPage.getVideoResource.error', {
			error,
			lessonId: params.lesson,
		})
	}

	return (
		<EditWorkshopLessonForm
			key={lesson.id}
			lesson={lesson}
			videoResource={videoResource}
		/>
	)
}
