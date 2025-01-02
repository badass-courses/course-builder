import * as React from 'react'
import { User } from '@auth/core/types'
import { type UseFormReturn } from 'react-hook-form'
import { Schema, z } from 'zod'

import type { ContentResource } from '@coursebuilder/core/schemas'

import { useAutoSave } from '../hooks/use-auto-save'
import { ResizableHandle } from '../primitives/resizable'
import { useToast } from '../primitives/use-toast'
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
	onPublish,
	sendResourceChatMessage,
	hostUrl,
	user,
	tools = [],
	theme = 'light',
	bodyPanelSlot,
	onResourceBodyChange = () => {},
	toggleMdxPreview,
	isShowingMdxPreview,
}: {
	onSave?: (resource: ContentResource) => Promise<void>
	onPublish?: (resource: ContentResource) => Promise<void>
	onArchive?: (resource: ContentResource) => Promise<void>
	onUnPublish?: (resource: ContentResource) => Promise<void>
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
	updateResource: (
		values: z.infer<typeof resourceSchema>,
		action?: 'save' | 'publish' | 'archive' | 'unpublish',
	) => Promise<any>
	availableWorkflows?: { value: string; label: string; default?: boolean }[]
	sendResourceChatMessage: (options: {
		resourceId: string
		messages: any[]
		selectedWorkflow?: string
	}) => Promise<void>
	hostUrl: string
	user?: User | null
	tools?: ResourceTool[]
	theme?: string
	bodyPanelSlot?: React.ReactNode
	onResourceBodyChange?: (value: string) => void
	toggleMdxPreview?: () => void
	isShowingMdxPreview?: boolean
}) {
	const { isAutoSaving, triggerAutoSave } = useAutoSave({
		onSave: async () => {
			await updateResource(form.getValues(), 'save')
		},
		inactivityTimeout: 1000,
	})
	const onSubmit = async (
		values: z.infer<typeof resourceSchema>,
		action: 'save' | 'publish' | 'archive' | 'unpublish' = 'save',
	) => {
		const updatedResource = await updateResource(values, action)
		if (action === 'publish' && onPublish) {
			return await onPublish(updatedResource)
		}

		if (updatedResource && onSave) {
			return await onSave(updatedResource)
		}
	}

	const { toast } = useToast()

	return (
		<>
			<EditResourcesActionBar
				resource={resource}
				resourcePath={getResourcePath(resource.fields?.slug)}
				isAutoSaving={isAutoSaving}
				onSubmit={async () => {
					await onSubmit(form.getValues(), 'save').then(() => {
						toast({
							title: '✅ Saved!',
						})
					})
				}}
				onPublish={async () => {
					form.setValue('fields.state', 'published')
					await onSubmit(form.getValues(), 'publish')
				}}
				onArchive={async () => {
					form.setValue('fields.state', 'archived')
					await onSubmit(form.getValues(), 'archive')
				}}
				onUnPublish={async () => {
					form.setValue('fields.state', 'draft')
					await onSubmit(form.getValues(), 'unpublish')
				}}
			/>
			<EditResourcePanelGroup>
				<EditResourcesMetadataPanel form={form} onSubmit={onSubmit}>
					{children}
				</EditResourcesMetadataPanel>
				<ResizableHandle />
				<EditResourcesBodyPanel
					user={user}
					partykitUrl={hostUrl}
					resource={resource}
					form={form}
					theme={theme}
					onResourceBodyChange={(value) => {
						onResourceBodyChange(value)
						triggerAutoSave()
					}}
					toggleMdxPreview={toggleMdxPreview}
					isShowingMdxPreview={isShowingMdxPreview}
				>
					{bodyPanelSlot}
				</EditResourcesBodyPanel>
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
