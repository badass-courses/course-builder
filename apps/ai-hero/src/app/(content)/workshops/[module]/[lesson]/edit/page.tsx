import * as React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import { notFound } from 'next/navigation'
import LayoutClient from '@/components/layout-client'
import { getLesson, getVideoResourceForLesson } from '@/lib/lessons-query'
import { getServerAuthSession } from '@/server/auth'
import { log } from '@/server/logger'

import { EditWorkshopLessonForm } from '../../../_components/edit-workshop-lesson-form'

export async function generateMetadata(
	props: {
		params: Promise<{ lesson: string }>
	},
	parent: ResolvingMetadata,
): Promise<Metadata> {
	const params = await props.params
	const lesson = await getLesson(params.lesson)

	if (!lesson) {
		return parent as Metadata
	}

	return {
		title: `✏️ ${lesson.fields?.title}`,
	}
}

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
		<LayoutClient>
			<EditWorkshopLessonForm
				key={lesson.id}
				lesson={lesson}
				videoResource={videoResource}
				moduleType="workshop"
			/>
		</LayoutClient>
	)
}
