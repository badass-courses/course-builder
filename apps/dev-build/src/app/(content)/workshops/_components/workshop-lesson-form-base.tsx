'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'
import { LessonMetadataFormFields } from '@/app/(content)/workshops/_components/edit-workshop-lesson-form-metadata'
import { Lesson, LessonSchema } from '@/lib/lessons'
import { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import { VideoResource } from '@coursebuilder/core/schemas'

/**
 * Props for the workshop lesson form base component
 */
export interface WorkshopLessonFormBaseProps {
	lesson: Lesson
	videoResource: VideoResource | null
	form: UseFormReturn<z.infer<typeof LessonSchema>>
	initialVideoResourceId?: string | null
}

/**
 * Base component for workshop lesson form
 * Contains only the lesson-specific fields and metadata
 * To be used with the withResourceForm HOC
 */
export function WorkshopLessonFormBase({
	lesson,
	videoResource,
	form,
	initialVideoResourceId,
}: WorkshopLessonFormBaseProps) {
	const initialVideoId =
		initialVideoResourceId ||
		lesson.resources?.find((resourceJoin) => {
			return resourceJoin.resource.type === 'videoResource'
		})?.resource.id ||
		videoResource?.id

	return (
		<LessonMetadataFormFields
			videoResource={videoResource}
			form={form}
			lesson={lesson}
		/>
	)
}
