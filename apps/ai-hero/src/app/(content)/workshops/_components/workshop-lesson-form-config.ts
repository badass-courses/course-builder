import { onLessonSave } from '@/app/(content)/tutorials/[module]/[lesson]/edit/actions'
import { ResourceFormConfig } from '@/components/resource-form/with-resource-form'
import { Lesson, LessonSchema } from '@/lib/lessons'
import { updateLesson } from '@/lib/lessons-query'
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

	// Update function
	updateResource: updateLesson as any, // Type casting for now, would need proper typing in real implementation

	// Save callback
	onSave: (resource) => onLessonSave(`/workshops/${moduleSlug}/`, resource),
})
