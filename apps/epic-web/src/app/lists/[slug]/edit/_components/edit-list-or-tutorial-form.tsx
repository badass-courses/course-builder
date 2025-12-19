'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import StandaloneVideoResourceUploaderAndViewer from '@/app/posts/_components/standalone-video-resource-uploader-and-viewer'
import { ImageResourceUploader } from '@/components/image-uploader/image-resource-uploader'
import {
	withResourceForm,
	type ResourceFormProps,
} from '@/components/resource-form/with-resource-form'
import type { BaseResourceFields } from '@/components/resource-form/with-resource-form'
import { List, ListSchema, type ListUpdate } from '@/lib/lists'
import { updateList, updateListItemFields } from '@/lib/lists-query'
import { ModuleSchema, type Module } from '@/lib/module'
import { updateTutorial } from '@/lib/tutorials-query'
import { ImagePlusIcon, VideoIcon } from 'lucide-react'

import type { ContentResource } from '@coursebuilder/core/schemas'

import { ListMetadataFormFields } from './list-metadata-form-fields'
import { TutorialMetadataFormFields } from './tutorial-metadata-form-fields'

// Type that satisfies the withResourceForm constraint
type ContentResourceWithFields = ContentResource & {
	fields: BaseResourceFields
}

/**
 * Base form component for lists - matches AI Hero's implementation
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
 * Base form component for tutorials - matches AI Hero's implementation
 */
function BaseTutorialForm({
	resource,
	form,
}: ResourceFormProps<ContentResourceWithFields, typeof ModuleSchema>) {
	if (!form) return null

	return (
		<React.Suspense fallback={<div>loading</div>}>
			<TutorialMetadataFormFields
				form={form}
				tutorial={resource as unknown as Module}
			/>
		</React.Suspense>
	)
}

/**
 * Form component that handles both lists and tutorials
 */
export function EditListOrTutorialForm({
	resource,
	resourceType,
}: {
	resource: ContentResource
	resourceType: 'list' | 'tutorial'
}) {
	const router = useRouter()

	if (resourceType === 'tutorial') {
		const TutorialForm = withResourceForm<
			ContentResourceWithFields,
			typeof ModuleSchema
		>(BaseTutorialForm, {
			resourceType: 'tutorial',
			schema: ModuleSchema,
			defaultValues: (resource) => {
				const tutorial = resource as unknown as Module
				return {
					id: tutorial?.id ?? '',
					type: 'tutorial',
					fields: {
						title: tutorial?.fields?.title ?? '',
						description: tutorial?.fields?.description ?? '',
						slug: tutorial?.fields?.slug ?? '',
						body: tutorial?.fields?.body ?? null,
						github: tutorial?.fields?.github ?? null,
						gitpod: tutorial?.fields?.gitpod ?? null,
						state: tutorial?.fields?.state ?? 'draft',
						visibility: tutorial?.fields?.visibility ?? 'unlisted',
						coverImage: tutorial?.fields?.coverImage ?? null,
					},
					resources: tutorial?.resources ?? [],
					resourceProducts: tutorial?.resourceProducts ?? null,
				}
			},
			getResourcePath: (slug) => `/${slug}`,
			updateResource: async (resource) => {
				if (!resource.id || !resource.fields) {
					throw new Error('Invalid resource data')
				}

				const result = await updateTutorial({
					id: resource.id,
					type: 'tutorial',
					fields: {
						title: resource.fields.title ?? '',
						description: resource.fields.description ?? null,
						slug: resource.fields.slug ?? '',
						body: resource.fields.body ?? null,
						github: resource.fields.github ?? null,
						gitpod: resource.fields.gitpod ?? null,
						state: resource.fields.state ?? 'draft',
						visibility: resource.fields.visibility ?? 'unlisted',
						coverImage: resource.fields.coverImage ?? null,
					},
					resources: resource.resources ?? [],
				} as Module)

				if (!result) {
					throw new Error('Failed to update tutorial')
				}

				return {
					...resource,
					...result,
					type: 'tutorial',
					fields: {
						...resource.fields,
						...(result.fields || {}),
					},
				} as ContentResourceWithFields
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
							<span className="flex text-lg font-bold">Lessons</span>
							<span className="text-muted-foreground mt-2 font-normal">
								Add and organize lessons in this tutorial.
							</span>
						</div>
					),
					showTierSelector: false,
					onResourceUpdate: async (itemId, data) => {
						await updateListItemFields(itemId, data)
					},
				},
			},
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
							uploadDirectory={`tutorials`}
						/>
					),
				},
			],
			createResourceConfig: {
				title: 'Add Content',
				availableTypes: [
					{ type: 'lesson' },
					{ type: 'section' },
					{ type: 'post', postTypes: ['article'] },
					{ type: 'post', postTypes: ['tip'] },
				],
				defaultType: { type: 'lesson' },
			},
		})

		return (
			<TutorialForm
				resource={resource as unknown as ContentResourceWithFields}
			/>
		)
	}

	// Handle list - matches AI Hero's implementation
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
		defaultValues: (resource) => {
			const list = resource as List
			return {
				id: list?.id ?? '',
				type: 'list',
				organizationId: list?.organizationId ?? null,
				createdAt: list?.createdAt ?? null,
				updatedAt: list?.updatedAt ?? null,
				deletedAt: list?.deletedAt ?? null,
				createdById: list?.createdById ?? '',
				createdByOrganizationMembershipId:
					list?.createdByOrganizationMembershipId ?? null,
				fields: {
					title: list?.fields?.title ?? '',
					description: list?.fields?.description ?? '',
					slug: list?.fields?.slug ?? '',
					type: list?.fields?.type ?? 'nextUp',
					visibility: list?.fields?.visibility ?? 'public',
					state: list?.fields?.state ?? 'draft',
					body: list?.fields?.body ?? null,
					summary: list?.fields?.summary ?? null,
					image: list?.fields?.image ?? null,
					github: list?.fields?.github ?? null,
					gitpod: list?.fields?.gitpod ?? null,
				},
				resources: list?.resources ?? [],
				tags: list?.tags ?? [],
			}
		},
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

	return <ListForm resource={resource as List} />
}
