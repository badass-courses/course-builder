import { onLessonSave } from '@/app/(content)/tutorials/[module]/[lesson]/edit/actions'
import { ResourceFormConfig } from '@/components/resource-form/with-resource-form'
import { Lesson, LessonSchema } from '@/lib/lessons'
import { updateLesson } from '@/lib/lessons-query'
import { log } from '@/server/logger'
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
		},
	}),

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

			// Ensure we never return null
			if (!updatedResource) {
				throw new Error(`Failed to update lesson with id ${resource.id}`)
			}

			// Use Zod to validate the result instead of type assertion
			const validationResult = LessonSchema.safeParse(updatedResource)

			if (!validationResult.success) {
				log.error('Invalid lesson data returned from update', {
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
