import * as React from 'react'
import { User } from '@auth/core/types'
import { type UseFormReturn } from 'react-hook-form'
import { Schema, z } from 'zod'

import { ContentResource } from '@coursebuilder/core/types'

import { ResizableHandle } from '../primitives/resizable'
import { EditResourcesActionBar } from './edit-resources-action-bar'
import {
	EditResourcesToolPanel,
	ResourceTool,
} from './edit-resources-tool-panel'
import { EditResourcePanelGroup } from './panels/edit-resource-panel-group'
import { EditResourcesBodyPanel } from './panels/edit-resources-body-panel'
import { EditResourcesMetadataPanel } from './panels/edit-resources-metadata-panel'

export function EditResourcesFormDesktop({
	resource,
	getResourcePath,
	resourceSchema,
	children,
	form,
	updateResource,
	availableWorkflows,
	onSave,
	sendResourceChatMessage,
	hostUrl,
	user,
	tools = [],
}: {
	onSave: (resource: ContentResource) => Promise<void>
	resource: ContentResource & {
		fields: {
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
	sendResourceChatMessage: (options: {
		resourceId: string
		messages: any[]
		selectedWorkflow?: string
	}) => Promise<void>
	hostUrl: string
	user?: User | null
	tools?: ResourceTool[]
}) {
	const onSubmit = async (values: z.infer<typeof resourceSchema>) => {
		const updatedResource = await updateResource(values)
		if (updatedResource) {
			onSave(updatedResource)
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
					sendResourceChatMessage={sendResourceChatMessage}
					hostUrl={hostUrl}
					user={user}
					tools={tools}
				/>
			</EditResourcePanelGroup>
		</>
	)
}
