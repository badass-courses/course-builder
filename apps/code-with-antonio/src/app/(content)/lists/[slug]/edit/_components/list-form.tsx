'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import StandaloneVideoResourceUploaderAndViewer from '@/app/(content)/posts/_components/standalone-video-resource-uploader-and-viewer'
import { ImageResourceUploader } from '@/components/image-uploader/image-resource-uploader'
import {
	withResourceForm,
	type ResourceFormProps,
} from '@/components/resource-form/with-resource-form'
import { List, ListSchema, type ListUpdate } from '@/lib/lists'
import { updateList, updateListItemFields } from '@/lib/lists-query'
import { ImagePlusIcon, VideoIcon } from 'lucide-react'

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
 * @param {Object} props - Component props
 * @param {List} props.resource - The list resource to edit
 */
export function EditListForm({ resource }: { resource: List }) {
	const router = useRouter()

	const ListForm = withResourceForm<List, typeof ListSchema>(BaseListForm, {
		resourceType: 'list',
		schema: ListSchema,
		customTools: [
			{
				id: 'images',
				icon: () => (
					<ImagePlusIcon strokeWidth={1.5} size={24} width={18} height={18} />
				),
				toolComponent: (
					<ImageResourceUploader
						key={'image-uploader'}
						belongsToResourceId={resource.id}
						uploadDirectory={`lists`}
					/>
				),
			},
			{
				id: 'videos',
				icon: () => (
					<VideoIcon strokeWidth={1.5} size={24} width={18} height={18} />
				),
				toolComponent: <StandaloneVideoResourceUploaderAndViewer />,
			},
		],
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
		onSave: async (resource, hasNewSlug) => {
			if (hasNewSlug) {
				router.push(`/lists/${resource.fields?.slug}/edit`)
			}
		},

		bodyPanelConfig: {
			showListResources: true,
			listEditorConfig: {
				title: (
					<div>
						<span className="flex text-lg font-bold">Resources</span>
						<span className="text-muted-foreground mt-2 font-normal">
							Add and organize resources in this list.
						</span>
					</div>
				),
				showTierSelector: false,
				onResourceUpdate: async (itemId, data) => {
					await updateListItemFields(itemId, data)
				},
			},
		},
		createResourceConfig: {
			title: 'Add Content',
			availableTypes: [
				{ type: 'post', postTypes: ['article'] },
				{ type: 'lesson' },
				{ type: 'section' },
			],
			defaultType: { type: 'post', postType: 'article' },
		},
	})

	return <ListForm resource={resource} />
}
