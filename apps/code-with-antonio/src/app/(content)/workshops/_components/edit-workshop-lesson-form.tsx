'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { withResourceForm } from '@/components/resource-form/with-resource-form'
import { Lesson, LessonSchema } from '@/lib/lessons'
import { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import { VideoResource } from '@coursebuilder/core/schemas'

import { WorkshopLessonFormBase } from './workshop-lesson-form-base'
import { createWorkshopLessonFormConfig } from './workshop-lesson-form-config'

/**
 * Wrapper component for editing workshop lessons
 * Handles slug changes by redirecting to the new URL
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
	const router = useRouter()
	const { module } = useParams<{ module: string }>()

	const config = createWorkshopLessonFormConfig(module)

	const LessonForm = withResourceForm<Lesson, typeof LessonSchema>(
		({ resource, form }) => {
			if (!form) return null

			return (
				<WorkshopLessonFormBase
					lesson={resource as Lesson}
					form={form as UseFormReturn<z.infer<typeof LessonSchema>>}
					videoResource={videoResource}
					initialVideoResourceId={videoResource?.id}
				/>
			)
		},
		{
			...config,
			onSave: async (resource, hasNewSlug) => {
				if (hasNewSlug) {
					router.push(`/workshops/${module}/${resource.fields?.slug}/edit`)
				}
			},
		},
	)

	return <LessonForm resource={lesson} />
}
