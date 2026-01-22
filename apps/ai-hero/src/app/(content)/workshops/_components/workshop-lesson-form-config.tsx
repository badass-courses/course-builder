import React from 'react'
import { onLessonSave } from '@/app/(content)/tutorials/[module]/[lesson]/edit/actions'
import { PageBlocks } from '@/app/admin/pages/_components/page-builder-mdx-components'
import {
	ResourceFormConfig,
	type BaseTool,
} from '@/components/resource-form/with-resource-form'
import { Lesson, LessonSchema, type LessonUpdate } from '@/lib/lessons'
import { autoUpdateLesson, updateLesson } from '@/lib/lessons-query'
import { ComponentIcon, ImagePlusIcon, VideoIcon } from 'lucide-react'
import { z } from 'zod'

import StandaloneVideoResourceUploaderAndViewer from '../../posts/_components/standalone-video-resource-uploader-and-viewer'
import { WorkshopMediaTool } from './workshop-media-tool'

const mediaUploadTool: BaseTool = {
	id: 'media',
	label: 'Media',
	icon: () =>
		React.createElement(ImagePlusIcon, {
			strokeWidth: 1.5,
			size: 24,
			width: 18,
			height: 18,
		}),
	toolComponent: React.createElement(WorkshopMediaTool),
}

/**
 * Configuration for the workshop lesson form
 */
export const createWorkshopLessonFormConfig = (
	moduleSlug: string,
): ResourceFormConfig<Lesson, typeof LessonSchema> => ({
	resourceType: 'lesson',
	schema: LessonSchema,
	// Default values for the form
	defaultValues: (lesson?: Partial<Lesson>): z.infer<typeof LessonSchema> => ({
		type: lesson?.type || 'lesson',
		id: lesson?.id || '',
		createdById: lesson?.createdById || '',
		organizationId: lesson?.organizationId || null,
		createdAt: lesson?.createdAt || null,
		updatedAt: lesson?.updatedAt || null,
		deletedAt: lesson?.deletedAt || null,
		createdByOrganizationMembershipId:
			lesson?.createdByOrganizationMembershipId || null,
		resources: lesson?.resources || null,
		fields: {
			title: lesson?.fields?.title || '',
			slug: lesson?.fields?.slug || 'new-lesson',
			state: lesson?.fields?.state || 'draft',
			visibility: lesson?.fields?.visibility || 'public',
			body: lesson?.fields?.body || '',
			description: lesson?.fields?.description || '',
			github: lesson?.fields?.github || '',
			gitpod: lesson?.fields?.gitpod || '',
			thumbnailTime: lesson?.fields?.thumbnailTime || 0,
			optional: lesson?.fields?.optional || false,
			prompt: lesson?.fields?.prompt || '',
		},
		tags: lesson?.tags || [],
	}),
	customTools: [
		{
			id: 'page-blocks',
			icon: () => (
				<ComponentIcon strokeWidth={1.5} size={24} width={18} height={18} />
			),
			toolComponent: (
				<div className="mt-3 px-5">
					<h3 className="mb-3 inline-flex text-xl font-bold">MDX Components</h3>
					<PageBlocks />
				</div>
			),
		},
		mediaUploadTool,
		{
			id: 'videos',
			icon: () => (
				<VideoIcon strokeWidth={1.5} size={24} width={18} height={18} />
			),
			toolComponent: <StandaloneVideoResourceUploaderAndViewer />,
		},
	],
	// Resource path generation
	getResourcePath: (slug?: string) => `/workshops/${moduleSlug}/${slug}`,

	// Update function - now we can pass the Lesson directly to updateLesson
	updateResource: async (resource: Partial<Lesson>): Promise<Lesson> => {
		try {
			if (!resource.id) {
				throw new Error('Lesson ID is required for updates')
			}
			const lessonUpdate: LessonUpdate = {
				id: resource.id,
				fields: {
					title: resource.fields?.title || '',
					body: resource.fields?.body || '',
					slug: resource.fields?.slug || '',
					description: resource.fields?.description || '',
					state: resource.fields?.state || 'draft',
					visibility: resource.fields?.visibility || 'public',
					github: resource.fields?.github || '',
					thumbnailTime: resource.fields?.thumbnailTime || 0,
					optional: resource.fields?.optional || false,
					prompt: resource.fields?.prompt || '',
				},
				tags: resource.tags || [],
			}

			// updateLesson now accepts Lesson type directly
			const updatedResource = await updateLesson(lessonUpdate)

			// Ensure we never return null
			if (!updatedResource) {
				throw new Error(`Failed to update lesson with id ${resource.id}`)
			}

			// Use Zod to validate the result instead of type assertion
			const validationResult = LessonSchema.safeParse(updatedResource)

			if (!validationResult.success) {
				console.error('Invalid lesson data returned from update', {
					errors: validationResult.error.format(),
					resourceId: resource.id,
					moduleSlug,
				})
				throw new Error(
					`Invalid lesson data returned from update: ${validationResult.error.message}`,
				)
			}

			return validationResult.data
		} catch (error) {
			console.error('Failed to update lesson', {
				error,
				resourceId: resource.id,
				moduleSlug,
			})
			throw error
		}
	},
	autoUpdateResource: async (resource: Partial<Lesson>) => {
		console.log('autoUpdateResource', resource)
		if (!resource.id || !resource.fields) {
			throw new Error('Invalid resource data')
		}
		const postUpdate: LessonUpdate = {
			id: resource.id,
			fields: {
				title: resource.fields.title || '',
				body: resource.fields.body || '',
				slug: resource.fields.slug || '',
				description: resource.fields.description || '',
				state: resource.fields.state || 'draft',
				visibility: resource.fields.visibility || 'public',
				github: resource.fields.github || '',
				thumbnailTime: resource.fields.thumbnailTime || 0,
				optional: resource.fields.optional || false,
				prompt: resource.fields.prompt || '',
			},
			tags: resource.tags || [],
		}
		const result = await autoUpdateLesson(postUpdate)
		return result as Lesson
	},
})
