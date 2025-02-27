'use client'

import * as React from 'react'
import { Lesson } from '@/lib/lessons'

import { VideoResource } from '@coursebuilder/core/schemas'

import { WithWorkshopLessonForm } from './with-workshop-lesson-form'

/**
 * Wrapper component for editing workshop lessons
 * Uses the WithWorkshopLessonForm HOC
 */
export function EditWorkshopLessonForm({
	lesson,
	videoResource,
	moduleType = 'workshop',
}: {
	lesson: Lesson
	videoResource: VideoResource | null
	moduleType?: 'tutorial' | 'workshop'
}) {
	return (
		<WithWorkshopLessonForm lesson={lesson} videoResource={videoResource} />
	)
}
