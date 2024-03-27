import * as React from 'react'
import { useRouter } from 'next/navigation'
import { EditResourcesActionBar } from '@/components/resources-crud/edit-resources-action-bar'
import { EditResourcesToolPanel } from '@/components/resources-crud/edit-resources-tool-panel'
import { EditResourcePanelGroup } from '@/components/resources-crud/panels/edit-resource-panel-group'
import { EditResourcesBodyPanel } from '@/components/resources-crud/panels/edit-resources-body-panel'
import { EditResourcesMetadataPanel } from '@/components/resources-crud/panels/edit-resources-metadata-panel'
import { type UseFormReturn } from 'react-hook-form'
import { Schema, z } from 'zod'

import { ContentResource } from '@coursebuilder/core/types'
import { ResizableHandle } from '@coursebuilder/ui'

export function EditResourcesFormDesktop({
	resource,
	getResourcePath,
	resourceSchema,
	children,
	form,
	updateResource,
	availableWorkflows,
}: {
	resource: ContentResource & {
		fields?: {
			body?: string | null
			title?: string | null
			slug: string
		}
	}
	getResourcePath: (slug?: string) => string
	resourceSchema: Schema
	children?: React.ReactNode
	form: UseFormReturn<z.infer<typeof resourceSchema>>
	updateResource: (values: z.infer<typeof resourceSchema>) => Promise<any>
	availableWorkflows?: { value: string; label: string; default?: boolean }[]
}) {
	const router = useRouter()

	const onSubmit = async (values: z.infer<typeof resourceSchema>) => {
		console.log({ values })
		const updatedResource = await updateResource(values)
		if (updatedResource) {
			router.push(getResourcePath(updatedResource.slug))
		}
	}

	return (
		<>
			<EditResourcesActionBar
				resource={resource}
				resourcePath={getResourcePath(resource.fields?.slug)}
				onSubmit={() => {
					onSubmit(form.getValues())
				}}
			/>
			<EditResourcePanelGroup>
				<EditResourcesMetadataPanel form={form} onSubmit={onSubmit}>
					{children}
				</EditResourcesMetadataPanel>
				<ResizableHandle />
				<EditResourcesBodyPanel resource={resource} form={form} />
				<ResizableHandle />
				<EditResourcesToolPanel
					resource={{ ...resource, ...form.getValues() }}
					availableWorkflows={availableWorkflows}
				/>
			</EditResourcePanelGroup>
		</>
	)
}
