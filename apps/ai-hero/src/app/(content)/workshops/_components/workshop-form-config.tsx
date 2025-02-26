import * as React from 'react'
import {
	BaseTool,
	ResourceFormConfig,
} from '@/components/resource-form/with-resource-form'
import { updateWorkshop } from '@/lib/workshops-query'
import { ImagePlusIcon, ListOrderedIcon } from 'lucide-react'
import { z } from 'zod'

import {
	ContentResource,
	ContentResourceSchema,
} from '@coursebuilder/core/schemas'

import { onWorkshopSave } from '../[module]/edit/actions'
import { WorkshopMediaTool } from './workshop-media-tool'
import { WorkshopResourcesTool } from './workshop-resources-tool'

/**
 * Define the workshop schema by extending ContentResourceSchema
 */
export const WorkshopSchema = ContentResourceSchema.merge(
	z.object({
		type: z.literal('workshop'),
		fields: z.object({
			title: z.string().min(1, { message: 'Title is required' }),
			subtitle: z.string().optional(),
			description: z.string().optional(),
			body: z.string().optional(),
			state: z
				.enum(['draft', 'published', 'archived', 'deleted'])
				.default('draft'),
			slug: z.string().min(1, { message: 'Slug is required' }),
			visibility: z.enum(['public', 'private', 'unlisted']).default('unlisted'),
			coverImage: z
				.object({
					url: z.string().optional(),
					alt: z.string().optional(),
				})
				.optional(),
			github: z.string().optional(),
		}),
	}),
)

/**
 * Workshop resource type definition
 */
export type WorkshopResourceType = z.infer<typeof WorkshopSchema>

/**
 * Type guard to check if a resource is a workshop
 *
 * @param resource The resource to check
 * @returns True if the resource is a workshop, false otherwise
 */
export function isWorkshopResource(
	resource: ContentResource,
): resource is WorkshopResourceType {
	return resource.type === 'workshop'
}

/**
 * Safely parse a ContentResource as a WorkshopResourceType
 *
 * @param resource The resource to parse
 * @returns The validated WorkshopResourceType
 * @throws {Error} If the resource is not a valid WorkshopResourceType
 */
export function parseWorkshopResource(
	resource: ContentResource,
): WorkshopResourceType {
	try {
		return WorkshopSchema.parse(resource)
	} catch (error) {
		console.error('Failed to parse workshop resource:', error)
		throw new Error('Invalid workshop resource')
	}
}

// Define BaseTool objects for our custom tools
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

const resourcesTool: BaseTool = {
	id: 'resources',
	label: 'Resources',
	icon: () =>
		React.createElement(ListOrderedIcon, {
			strokeWidth: 1.5,
			size: 24,
			width: 18,
			height: 18,
		}),
	toolComponent: React.createElement(WorkshopResourcesTool),
}

/**
 * Factory function to create a workshop form configuration
 * Ensures type safety when creating form configs
 */
export function createWorkshopFormConfig(
	customConfig?: Partial<
		Omit<
			ResourceFormConfig<WorkshopResourceType, typeof WorkshopSchema>,
			'resourceType' | 'schema'
		>
	>,
): ResourceFormConfig<WorkshopResourceType, typeof WorkshopSchema> {
	return {
		resourceType: 'workshop',
		schema: WorkshopSchema,

		// Generate default values for the form
		defaultValues: (workshop) => ({
			type: 'workshop' as const,
			id: workshop?.id || '',
			resources: workshop?.resources || [],
			organizationId: workshop?.organizationId || null,
			createdAt: workshop?.createdAt || null,
			updatedAt: workshop?.updatedAt || null,
			deletedAt: workshop?.deletedAt || null,
			createdById: workshop?.createdById || '',
			createdByOrganizationMembershipId:
				workshop?.createdByOrganizationMembershipId || null,
			fields: {
				title: workshop?.fields?.title || '',
				subtitle: workshop?.fields?.subtitle || '',
				description: workshop?.fields?.description || '',
				slug: workshop?.fields?.slug || '',
				state: (workshop?.fields?.state || 'draft') as
					| 'draft'
					| 'published'
					| 'archived'
					| 'deleted',
				body: workshop?.fields?.body || '',
				visibility: (workshop?.fields?.visibility || 'unlisted') as
					| 'public'
					| 'private'
					| 'unlisted',
				coverImage: workshop?.fields?.coverImage || { url: '', alt: '' },
				github: workshop?.fields?.github || '',
			},
		}),

		// Resource path generation
		getResourcePath: (slug) => `/workshops/${slug}`,

		// Resource update function
		updateResource: updateWorkshop as unknown as (
			resource: Partial<WorkshopResourceType>,
		) => Promise<WorkshopResourceType>,

		// Save callback
		onSave: onWorkshopSave,

		// Custom tools
		customTools: [mediaUploadTool, resourcesTool],
		...customConfig,
	}
}

/**
 * Workshop form configuration
 */
export const workshopFormConfig = createWorkshopFormConfig()
