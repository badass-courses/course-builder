'use client'

import * as React from 'react'
import {
	withResourceForm,
	type ResourceFormProps,
} from '@/components/resource-form/with-resource-form'
import { List, ListSchema, type ListUpdate } from '@/lib/lists'
import { updateList } from '@/lib/lists-query'

import { ListMetadataFormFields } from './list-metadata-form-fields'

/**
 * Base list form component wrapped with resource form functionality
 * @param {ResourceFormProps<List, typeof ListSchema>} props - Component props
 */
function BaseListForm({
	resource,
	form,
}: ResourceFormProps<List, typeof ListSchema>) {
	if (!form) return null

	return (
		<React.Suspense fallback={<div>loading</div>}>
			<ListMetadataFormFields form={form} list={resource} />
		</React.Suspense>
	)
}

/**
 * Enhanced list form with resource form functionality
 */
export const ListForm = withResourceForm<List, typeof ListSchema>(
	BaseListForm,
	{
		resourceType: 'list',
		schema: ListSchema,
		defaultValues: (resource) => ({
			id: resource?.id ?? '',
			type: 'list',
			organizationId: resource?.organizationId ?? null,
			createdAt: resource?.createdAt ?? null,
			updatedAt: resource?.updatedAt ?? null,
			deletedAt: resource?.deletedAt ?? null,
			createdById: resource?.createdById ?? '',
			createdByOrganizationMembershipId:
				resource?.createdByOrganizationMembershipId ?? null,
			fields: {
				title: resource?.fields?.title ?? '',
				description: resource?.fields?.description ?? '',
				slug: resource?.fields?.slug ?? '',
				type: resource?.fields?.type ?? 'nextUp',
				visibility: resource?.fields?.visibility ?? 'public',
				state: resource?.fields?.state ?? 'draft',
				body: resource?.fields?.body ?? null,
				summary: resource?.fields?.summary ?? null,
				image: resource?.fields?.image ?? null,
				github: resource?.fields?.github ?? null,
				gitpod: resource?.fields?.gitpod ?? null,
			},
			resources: resource?.resources ?? [],
			tags: resource?.tags ?? [],
		}),
		getResourcePath: (slug) => `/${slug}`,
		updateResource: async (resource) => {
			if (!resource.id || !resource.fields) {
				throw new Error('Invalid resource data')
			}

			const result = await updateList(
				{
					id: resource.id,
					fields: {
						title: resource.fields.title ?? '',
						body: resource.fields.body ?? null,
						slug: resource.fields.slug ?? '',
						type: resource.fields.type ?? 'nextUp',
						description: resource.fields.description ?? '',
						state: resource.fields.state ?? 'draft',
						visibility: resource.fields.visibility ?? 'unlisted',
						image: resource.fields.image ?? null,
						github: resource.fields.github ?? null,
						gitpod: resource.fields.gitpod ?? null,
					},
					resources: resource.resources ?? [],
					tags: resource.tags ?? [],
				},
				'save',
			)

			if (!result) {
				throw new Error('Failed to update list')
			}

			return {
				...resource,
				...result,
				type: 'list',
			} as List
		},
		bodyPanelConfig: {
			showListResources: true,
		},
		createPostConfig: {
			title: 'Create a Resource',
			defaultResourceType: 'article',
			availableResourceTypes: ['article'],
		},
	},
)
