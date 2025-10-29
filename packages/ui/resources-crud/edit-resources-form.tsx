import * as React from 'react'
import { User } from '@auth/core/types'
import { type UseFormReturn } from 'react-hook-form'
import { Schema, z } from 'zod'

import type { ContentResource } from '@coursebuilder/core/schemas'

import { useAutoSave } from '../hooks/use-auto-save'
import { useIsSmallScreen } from '../hooks/use-is-small-screen'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '../primitives/accordion'
import { ResizableHandle, ResizablePanel } from '../primitives/resizable'
import { ScrollArea } from '../primitives/scroll-area'
import { useToast } from '../primitives/use-toast'
import { EditResourcesActionBar } from './edit-resources-action-bar'
import {
	EditResourcesToolPanel,
	ResourceTool,
} from './edit-resources-tool-panel'
import { EditResourcePanelGroup } from './panels/edit-resource-panel-group'
import { EditResourcesBodyPanel } from './panels/edit-resources-body-panel'
import { EditResourcesMetadataPanel } from './panels/edit-resources-metadata-panel'

export function EditResourcesForm({
	resource,
	getResourcePath,
	resourceSchema,
	children,
	form,
	updateResource,
	autoUpdateResource,
	availableWorkflows,
	onSave,
	onPublish,
	sendResourceChatMessage,
	hostUrl,
	user,
	tools = [],
	theme = 'light',
	bodyPanelSlot,
	mdxPreviewComponent,
	onResourceBodyChange = () => {},
	toggleMdxPreview,
	isShowingMdxPreview,
	breadcrumb = [],
}: {
	onSave?: (resource: ContentResource, hasNewSlug: boolean) => Promise<void>
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
	getResourcePath: (slug?: string, path?: string) => string
	resourceSchema: Schema
	children?: React.ReactNode
	form: UseFormReturn<z.infer<typeof resourceSchema>>
	updateResource: (
		values: z.infer<typeof resourceSchema>,
		action?: 'save' | 'publish' | 'archive' | 'unpublish',
	) => Promise<any>
	autoUpdateResource?: (
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
	mdxPreviewComponent?: React.ReactNode
	onResourceBodyChange?: (value: string) => void
	toggleMdxPreview?: () => void
	isShowingMdxPreview?: boolean
	breadcrumb?: { title: string; href?: string }[]
}) {
	const { isAutoSaving, triggerAutoSave } = useAutoSave({
		onSave: async () => {
			autoUpdateResource && (await autoUpdateResource(form.getValues(), 'save'))
		},
		inactivityTimeout: 2000,
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
			const hasNewSlug = resource.fields.slug !== updatedResource.fields.slug

			return await onSave(updatedResource, hasNewSlug)
		}
	}

	const { toast } = useToast()
	const isSmallScreen = useIsSmallScreen()

	return isSmallScreen ? (
		// Mobile version
		<Accordion type="multiple" defaultValue={['body']}>
			<EditResourcesActionBar
				resource={{ ...resource, ...form.getValues() }}
				resourcePath={getResourcePath(
					resource.fields?.slug,
					resource.fields?.path,
				)}
				isAutoSaving={isAutoSaving}
				breadcrumb={breadcrumb}
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
			<AccordionItem value="metadata">
				<AccordionTrigger className="bg-card flex w-full items-center justify-between p-5">
					Metadata
				</AccordionTrigger>
				<AccordionContent>
					<EditResourcesMetadataPanel form={form} onSubmit={onSubmit}>
						{children}
					</EditResourcesMetadataPanel>
				</AccordionContent>
			</AccordionItem>
			<AccordionItem value="body">
				<AccordionTrigger className="bg-card flex w-full items-center justify-between p-5">
					Body
				</AccordionTrigger>
				<AccordionContent>
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
						mdxPreviewComponent={mdxPreviewComponent}
					>
						{bodyPanelSlot}
					</EditResourcesBodyPanel>
				</AccordionContent>
			</AccordionItem>
			{/* <EditResourcesToolPanel
				resource={{ ...resource, ...form.getValues() }}
				availableWorkflows={availableWorkflows}
				sendResourceChatMessage={sendResourceChatMessage}
				hostUrl={hostUrl}
				user={user}
				tools={tools}
			/> */}
		</Accordion>
	) : (
		// Desktop version
		<>
			<EditResourcesActionBar
				resource={{ ...resource, ...form.getValues() }}
				resourcePath={getResourcePath(
					resource.fields?.slug,
					resource.fields?.path,
				)}
				isAutoSaving={isAutoSaving}
				breadcrumb={breadcrumb}
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
				<ResizablePanel
					id="edit-resources-metadata-panel"
					order={1}
					minSize={5}
					defaultSize={20}
					maxSize={35}
					className=""
				>
					<EditResourcesMetadataPanel form={form} onSubmit={onSubmit}>
						{children}
					</EditResourcesMetadataPanel>
				</ResizablePanel>
				<ResizableHandle />
				<>
					{isShowingMdxPreview && (
						<>
							<ResizablePanel
								id="edit-resources-body-preview-panel"
								order={2}
								defaultSize={20}
							>
								{mdxPreviewComponent}
							</ResizablePanel>
							<ResizableHandle />
						</>
					)}
					<ResizablePanel
						id="edit-resources-body-panel"
						order={isShowingMdxPreview ? 3 : 2}
						defaultSize={55}
						className=""
					>
						<ScrollArea className="h-(--pane-layout-height) flex w-full flex-col justify-start overflow-y-auto">
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
								mdxPreviewComponent={mdxPreviewComponent}
							>
								{bodyPanelSlot}
							</EditResourcesBodyPanel>
						</ScrollArea>
					</ResizablePanel>
				</>
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
