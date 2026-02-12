'use client'

import * as React from 'react'
import {
	BaseTool,
	ResourceFormConfig,
} from '@/components/resource-form/with-resource-form'
import { updateListItemFields } from '@/lib/lists-query'
import { WorkshopSchema, type Workshop } from '@/lib/workshops'
import { updateWorkshop } from '@/lib/workshops-query'
import { ImagePlusIcon, ListOrderedIcon, VideoIcon } from 'lucide-react'
import { z } from 'zod'

import {
	ContentResource,
	ContentResourceSchema,
} from '@coursebuilder/core/schemas'

import StandaloneVideoResourceUploaderAndViewer from '../../posts/_components/standalone-video-resource-uploader-and-viewer'
import { onWorkshopSave } from '../[module]/edit/actions'
import { WorkshopMediaTool } from './workshop-media-tool'
import { WorkshopResourcesTool } from './workshop-resources-tool'

/**
 * Type guard to check if a resource is a workshop
 *
 * @param resource The resource to check
 * @returns True if the resource is a workshop, false otherwise
 */
export function isWorkshopResource(
	resource: ContentResource,
): resource is ContentResource {
	return resource.type === 'workshop'
}

/**
 * Safely parse a ContentResource as a WorkshopResourceType
 *
 * @param resource The resource to parse
 * @returns The validated WorkshopResourceType
 * @throws {Error} If the resource is not a valid WorkshopResourceType
 */
export function parseWorkshopResource(resource: ContentResource): Workshop {
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
			ResourceFormConfig<Workshop, typeof WorkshopSchema>,
			'resourceType' | 'schema'
		>
	>,
): ResourceFormConfig<Workshop, typeof WorkshopSchema> {
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
				timezone: workshop?.fields?.timezone || 'America/Los_Angeles',
				startsAt: workshop?.fields?.startsAt
					? new Date(workshop.fields.startsAt).toISOString()
					: undefined,
				endsAt: workshop?.fields?.endsAt
					? new Date(workshop.fields.endsAt).toISOString()
					: undefined,
			},
		}),

		// Resource path generation
		// getResourcePath: (slug) => `/workshops/${slug}`,
		getResourcePath: (slug?: string) => `/workshops/${slug || ''}`,

		// Resource update function
		// Only send id and fields to avoid exceeding body size limit.
		// The server fetches resources from the database directly.
		updateResource: async (resource: Partial<Workshop>) => {
			if (!resource.id || !resource.fields) {
				throw new Error('Invalid resource data')
			}
			// Strip resources to avoid 1MB body limit - server fetches them from DB
			const { resources, ...resourceWithoutResources } = resource
			await updateWorkshop(resourceWithoutResources)
			return resource as Workshop
		},
		// Custom tools
		customTools: [
			mediaUploadTool,
			resourcesTool,
			{
				id: 'videos',
				icon: () => (
					<VideoIcon strokeWidth={1.5} size={24} width={18} height={18} />
				),
				toolComponent: <StandaloneVideoResourceUploaderAndViewer />,
			},
		], // resourcesTool provides a custom UI for resource management
		createResourceConfig: {
			title: 'Add Content',
			availableTypes: [
				{ type: 'post', postTypes: ['article'] },
				{ type: 'tutorial' },
				{ type: 'lesson' },
				{ type: 'section' },
			],
			defaultType: { type: 'lesson' },
		},
		bodyPanelConfig: {
			showListResources: true, // Enables the built-in resource list view - works alongside resourcesTool which provides additional resource management features
			listEditorConfig: {
				title: (
					<div>
						<span className="flex text-lg font-bold">Resources</span>
						<span className="text-muted-foreground mt-2 font-normal">
							Add and organize resources in this workshop.
						</span>
					</div>
				),
				showTierSelector: true,
				onResourceUpdate: async (itemId, data) => {
					await updateListItemFields(itemId, data)
				},
			},
		},
		...customConfig,
	}
}

/**
 * Workshop form configuration
 */
export const workshopFormConfig = createWorkshopFormConfig()
