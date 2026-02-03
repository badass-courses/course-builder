'use client'

import * as React from 'react'
import { createContext, useContext, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { withResourceForm } from '@/components/resource-form/with-resource-form'
import { Lesson, LessonSchema } from '@/lib/lessons'
import { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import { VideoResource } from '@coursebuilder/core/schemas'

import { WorkshopLessonFormBase } from './workshop-lesson-form-base'
import { createWorkshopLessonFormConfig } from './workshop-lesson-form-config'

/**
 * Context for passing video resource to the form without prop drilling through HOC
 */
const VideoResourceContext = createContext<{
	videoResource: VideoResource | null
}>({ videoResource: null })

/**
 * Inner form component that reads video resource from context
 */
function LessonFormInner({
	resource,
	form,
}: {
	resource: Lesson
	form?: UseFormReturn<z.infer<typeof LessonSchema>>
}) {
	const { videoResource } = useContext(VideoResourceContext)
	if (!form) return null

	return (
		<WorkshopLessonFormBase
			lesson={resource}
			form={form}
			videoResource={videoResource}
			initialVideoResourceId={videoResource?.id}
		/>
	)
}

/**
 * Wrapper component for editing workshop lessons
 * Handles slug changes by redirecting to the new URL
 */
export function EditWorkshopLessonForm({
	lesson,
	videoResource,
}: {
	lesson: Lesson
	videoResource: VideoResource | null
}) {
	const { module } = useParams<{ module: string }>()

	// Memoize the wrapped form component - only recreates when module changes
	const LessonForm = useMemo(() => {
		const config = createWorkshopLessonFormConfig(module)
		return withResourceForm<Lesson, typeof LessonSchema>(LessonFormInner, {
			...config,
			onSave: async (resource, hasNewSlug) => {
				if (hasNewSlug) {
					window.location.assign(
						`/workshops/${module}/${resource.fields?.slug}/edit`,
					)
				}
			},
		})
	}, [module])

	return (
		<VideoResourceContext.Provider value={{ videoResource }}>
			<LessonForm resource={lesson} />
		</VideoResourceContext.Provider>
	)
}
