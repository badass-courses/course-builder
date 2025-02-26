import { onLessonSave } from '@/app/(content)/tutorials/[module]/[lesson]/edit/actions'
import { ResourceFormConfig } from '@/components/resource-form/with-resource-form'
import { Lesson, LessonSchema } from '@/lib/lessons'
import { updateLesson } from '@/lib/lessons-query'
import { log } from '@/server/logger'
import pluralize from 'pluralize'
import { z } from 'zod'

/**
 * Configuration for the workshop lesson form
 */
export const createWorkshopLessonFormConfig = (
	moduleSlug: string,
): ResourceFormConfig<Lesson, typeof LessonSchema> => ({
	resourceType: 'lesson',
	schema: LessonSchema,

	// Default values for the form
	defaultValues: (lesson) =>
		({
			type: 'lesson',
			id: lesson?.id || '',
			createdById: lesson?.createdById || '',
			organizationId: lesson?.organizationId || null,
			createdAt: lesson?.createdAt || null,
			updatedAt: lesson?.updatedAt || null,
			deletedAt: lesson?.deletedAt || null,
			resources: lesson?.resources || null,
			createdByOrganizationMembershipId:
				lesson?.createdByOrganizationMembershipId || null,
			fields: {
				title: lesson?.fields?.title || '',
				slug: lesson?.fields?.slug || '',
				body: lesson?.fields?.body || '',
				visibility: lesson?.fields?.visibility || 'public',
				state: lesson?.fields?.state || 'draft',
				description: lesson?.fields?.description || '',
				github: lesson?.fields?.github || '',
				gitpod: lesson?.fields?.gitpod || '',
			},
		}) as z.infer<typeof LessonSchema>,

	// Resource path generation
	getResourcePath: (slug?: string) => `/workshops/${moduleSlug}/${slug}`,

	// Update function - now we can pass the Lesson directly to updateLesson
	updateResource: async (resource: Partial<Lesson>): Promise<Lesson> => {
		try {
			if (!resource.id) {
				throw new Error('Lesson ID is required for updates')
			}

			// updateLesson now accepts Lesson type directly
			const updatedResource = await updateLesson(resource)

			return updatedResource as Lesson
		} catch (error) {
			log.error('Failed to update lesson', {
				error,
				resourceId: resource.id,
				moduleSlug,
			})
			throw error
		}
	},

	// Save callback
	onSave: (resource) => onLessonSave(`/workshops/${moduleSlug}/`, resource),
})
