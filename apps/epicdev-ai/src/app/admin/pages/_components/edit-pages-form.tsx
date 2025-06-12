'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import StandaloneVideoResourceUploaderAndViewer from '@/app/(content)/posts/_components/standalone-video-resource-uploader-and-viewer'
import { ImageResourceUploader } from '@/components/image-uploader/image-resource-uploader'
import {
	ResourceFormProps,
	withResourceForm,
	type ResourceFormConfig,
} from '@/components/resource-form/with-resource-form'
import { Page, PageSchema } from '@/lib/pages'
import { updatePage } from '@/lib/pages-query'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import { ImagePlusIcon, LayoutTemplate, VideoIcon } from 'lucide-react'
import { z } from 'zod'

import {
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
} from '@coursebuilder/ui'
import { EditResourcesMetadataFields } from '@coursebuilder/ui/resources-crud/edit-resources-metadata-fields'
import { MetadataFieldDescription } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-description'
import { MetadataFieldSlug } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-slug'
import { MetadataFieldSocialImage } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-social-image'
import { MetadataFieldState } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-state'
import { MetadataFieldTitle } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-title'
import { MetadataFieldVisibility } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-visibility'

import { PageBlocks } from './page-builder-mdx-components'
import SearchConfig from './search-config'

const PageResourcesTitle = () => (
	<div>
		<span className="flex text-lg font-bold">Resources</span>
		<span className="text-muted-foreground mt-2 font-normal">
			Attach resources to this page to create a curated collection that can be
			displayed in any order.
		</span>
	</div>
)

// Wrapper function for updateResource to match HOC's Partial<T> input and return type
async function updatePageResource(pageUpdate: Partial<Page>): Promise<Page> {
	if (!pageUpdate.id || !pageUpdate.fields) {
		console.error('Update payload missing required fields:', pageUpdate)
		throw new Error('Update payload missing required fields: id, fields')
	}

	// Convert partial to full Page for updatePage function
	const updatePayload: Page = {
		type: 'page',
		id: pageUpdate.id,
		organizationId: pageUpdate.organizationId || null,
		createdAt: pageUpdate.createdAt || null,
		updatedAt: pageUpdate.updatedAt || null,
		deletedAt: pageUpdate.deletedAt || null,
		createdById: pageUpdate.createdById || '',
		resources: pageUpdate.resources || [],
		createdByOrganizationMembershipId:
			pageUpdate.createdByOrganizationMembershipId || null,
		fields: {
			title: pageUpdate.fields.title || '',
			body: pageUpdate.fields.body || '',
			slug: pageUpdate.fields.slug || '',
			path: pageUpdate.fields.path || '',
			description: pageUpdate.fields.description || '',
			state: pageUpdate.fields.state || 'draft',
			visibility: pageUpdate.fields.visibility || 'public',
			socialImage: pageUpdate.fields.socialImage,
		},
	}

	const updatedPage = await updatePage(updatePayload)

	if (!updatedPage) {
		console.error('Failed to update page, received null', { updatePayload })
		throw new Error('Failed to update page.')
	}

	return updatedPage as Page
}

// Define the configuration for the page form
const pageFormConfig: ResourceFormConfig<Page, typeof PageSchema> = {
	resourceType: 'page',
	schema: PageSchema,
	defaultValues: (page?: Page) => {
		if (!page) {
			return {
				type: 'page',
				fields: {
					title: '',
					body: '',
					visibility: 'public',
					description: '',
					state: 'draft',
					slug: '',
					path: '',
					socialImage: {
						type: 'imageUrl',
						url: '',
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
			} as Page
		}

		return {
			...page,
			fields: {
				...page.fields,
				title: page.fields?.title || '',
				body: page.fields?.body || '',
				slug: page.fields?.slug || '',
				path: page.fields?.path || '',
				visibility: page.fields?.visibility || 'public',
				state: page.fields?.state || 'draft',
				description: page.fields?.description ?? '',
				socialImage: page.fields?.socialImage ?? {
					type: 'imageUrl',
					url: getOGImageUrlForResource(page),
				},
			},
		}
	},
	getResourcePath: (slug?: string, path?: string) =>
		`${path || (slug ? `/${slug}` : '')}`,
	updateResource: updatePageResource,
	createResourceConfig: {
		title: 'Create a Resource',
		defaultType: { type: 'post', postType: 'article' },
		availableTypes: [{ type: 'post', postTypes: ['article'] }],
	},
	bodyPanelConfig: {
		showListResources: true,
		listEditorConfig: {
			title: <PageResourcesTitle />,
			showTierSelector: false,
			searchConfig: <SearchConfig />,
		},
	},
}

export function EditPagesForm({ page }: { page: Page }) {
	const router = useRouter()

	const PageForm = withResourceForm((props) => <PageFormFields {...props} />, {
		...pageFormConfig,
		onSave: async (resource, hasNewSlug) => {
			if (hasNewSlug) {
				router.push(`/admin/pages/${resource.fields?.slug}/edit`)
			}
		},
		customTools: [
			{
				id: 'MDX Components',
				label: 'MDX Components',
				icon: () => (
					<LayoutTemplate strokeWidth={1.5} size={24} width={18} height={18} />
				),
				toolComponent: (
					<div className="mt-3 px-5">
						<h3 className="mb-3 inline-flex text-xl font-bold">
							MDX Components
						</h3>
						<PageBlocks />
					</div>
				),
			},
			{
				id: 'images',
				icon: () => (
					<ImagePlusIcon strokeWidth={1.5} size={24} width={18} height={18} />
				),
				toolComponent: (
					<ImageResourceUploader
						key={'image-uploader'}
						belongsToResourceId={page.id}
						uploadDirectory={`workshops`}
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
	})

	return <PageForm resource={page} />
}

// Form fields component with proper ResourceFormProps interface
const PageFormFields = ({
	form,
	resource,
}: ResourceFormProps<Page, typeof PageSchema>) => {
	// Handle potential undefined form prop
	if (!form) {
		return null
	}

	return (
		<>
			<MetadataFieldTitle form={form} />
			<MetadataFieldSlug form={form} />
			<FormField
				control={form.control}
				name="fields.path"
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel className="text-lg font-bold">Path</FormLabel>
						<FormDescription>
							Used to match the page to a URL path. Example:{' '}
							<code>/events/workshops/mcp</code>
						</FormDescription>
						<Input {...field} value={field.value || ''} />
						<FormMessage />
					</FormItem>
				)}
			/>
			<MetadataFieldVisibility form={form} />
			<MetadataFieldState form={form} />
			<MetadataFieldDescription form={form} />
			<MetadataFieldSocialImage
				form={form}
				currentSocialImage={getOGImageUrlForResource(form.getValues())}
			/>
		</>
	)
}
