import { ResourceFormConfig } from '@/components/resource-form/with-resource-form'
import { Workshop, WorkshopSchema } from '@/lib/workshops'
import { updateWorkshop } from '@/lib/workshops/workshops.service'

/**
 * Configuration for the workshop form including schema validation and resource handling
 */
export const workshopFormConfig: ResourceFormConfig<
	Workshop,
	typeof WorkshopSchema
> = {
	resourceType: 'workshop',
	schema: WorkshopSchema,
	defaultValues: (workshop?: Workshop) => {
		if (!workshop) {
			return {
				type: 'workshop',
				fields: {
					title: '',
					description: '',
					body: '',
					slug: '',
					state: 'draft',
					visibility: 'unlisted',
					coverImage: { url: '', alt: '' },
					github: '',
					timezone: 'America/Los_Angeles',
					workshopApp: {
						externalUrl: '',
						port: '',
					},
				},
				id: '',
				organizationId: null,
				createdAt: null,
				updatedAt: null,
				deletedAt: null,
				createdById: '',
				resources: [],
				createdByOrganizationMembershipId: null,
				tags: [],
			} as Workshop
		}

		return {
			...workshop,
			fields: {
				...workshop.fields,
				title: workshop.fields?.title || '',
				description: workshop.fields?.description || '',
				body: workshop.fields?.body || '',
				slug: workshop.fields?.slug || '',
				state: workshop.fields?.state || 'draft',
				visibility: workshop.fields?.visibility || 'unlisted',
				coverImage: workshop.fields?.coverImage || { url: '', alt: '' },
				github: workshop.fields?.github || '',
				timezone: workshop.fields?.timezone || 'America/Los_Angeles',
				workshopApp: workshop.fields?.workshopApp || {
					externalUrl: '',
					port: '',
				},
				startsAt: workshop.fields?.startsAt
					? new Date(workshop.fields.startsAt).toISOString()
					: undefined,
				endsAt: workshop.fields?.endsAt
					? new Date(workshop.fields.endsAt).toISOString()
					: undefined,
			},
		}
	},
	getResourcePath: (slug?: string) => `/workshops/${slug || ''}`,
	updateResource: async (resource: Partial<Workshop>) => {
		if (!resource.id || !resource.fields) {
			throw new Error('Invalid resource data')
		}

		const result = await updateWorkshop({
			id: resource.id,
			fields: resource.fields,
			createdById: resource.createdById,
		})

		if (!result) {
			throw new Error('Failed to update workshop')
		}

		return result as Workshop
	},
	createResourceConfig: {
		title: 'Add Content',
		availableTypes: [
			{ type: 'lesson' },
			{ type: 'section' },
			{ type: 'post', postTypes: ['article'] },
		],
		defaultType: { type: 'lesson' },
	},
	bodyPanelConfig: {
		showListResources: true,
	},
}
