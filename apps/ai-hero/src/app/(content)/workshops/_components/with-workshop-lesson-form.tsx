'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'
import { withResourceForm } from '@/components/resource-form/with-resource-form'
import { Lesson, LessonSchema } from '@/lib/lessons'
import { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import { VideoResource } from '@coursebuilder/core/schemas'

import { WorkshopLessonFormBase } from './workshop-lesson-form-base'
import { createWorkshopLessonFormConfig } from './workshop-lesson-form-config'

/**
 * Higher-order component for workshop lesson forms
 * Takes lesson and videoResource props and creates a form component
 *
 * @returns A component that renders the workshop lesson form
 */
export function createWithWorkshopLessonForm(moduleSlug: string) {
	// Create the form config using the module slug
	const config = createWorkshopLessonFormConfig(moduleSlug)

	// Return the wrapped component
	return withResourceForm<Lesson, typeof LessonSchema>(
		// The base component receives resource as lesson and form
		({ resource, form }) => {
			if (!form) return null

			return (
				<WorkshopLessonFormBase
					lesson={resource as Lesson}
					form={form as UseFormReturn<z.infer<typeof LessonSchema>>}
					videoResource={null} // This should be passed in from parent
					initialVideoResourceId={null} // This should be passed in from parent
				/>
			)
		},
		config,
	)
}

/**
 * Component props for the WithWorkshopLessonForm
 */
export interface WithWorkshopLessonFormProps {
	lesson: Lesson
	videoResource: VideoResource | null
}

/**
 * HOC-wrapped component for editing workshop lessons
 * Extracts module slug from URL params and creates the form
 */
export function WithWorkshopLessonForm({
	lesson,
	videoResource,
}: WithWorkshopLessonFormProps) {
	// Get module slug from URL params
	const { module } = useParams<{ module: string }>()

	// Create the form component with the module slug
	const LessonForm = React.useMemo(
		() => createWithWorkshopLessonForm(module),
		[module],
	)

	// Render the form with the lesson resource
	return <LessonForm resource={lesson} />
}
