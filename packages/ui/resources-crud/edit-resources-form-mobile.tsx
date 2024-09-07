import * as React from 'react'
import { User } from '@auth/core/types'
import type { UseFormReturn } from 'react-hook-form'
import { Schema, z } from 'zod'

import type { ContentResource } from '@coursebuilder/core/schemas'

import { ResourceChatAssistant } from '../chat-assistant/resource-chat-assistant'
import { CodemirrorEditor } from '../codemirror/editor'
import { Button } from '../primitives/button'
import { Form } from '../primitives/form'
import { ResourceTool } from './edit-resources-tool-panel'

export function EditResourcesFormMobile({
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
			<div className="md:bg-muted bg-muted/60 sticky top-0 z-10 flex h-9 w-full items-center justify-between px-1 backdrop-blur-md md:backdrop-blur-none">
				<div className="flex items-center gap-2">
					<Button className="px-0" asChild variant="link">
						<a
							href={getResourcePath(resource.fields?.slug)}
							className="aspect-square"
						>
							←
						</a>
					</Button>
					<span className="font-medium">
						Article{' '}
						<span className="hidden font-mono text-xs font-normal md:inline-block">
							({resource.id})
						</span>
					</span>
				</div>
				<Button
					onClick={(e) => {
						onSubmit(form.getValues())
					}}
					type="button"
					variant="default"
					size="sm"
					className="h-7 disabled:cursor-wait"
				>
					Save
				</Button>
			</div>
			<Form {...form}>
				<form
					className="min-h-[280px] min-w-[280px]"
					onSubmit={form.handleSubmit(onSubmit, (error) => {
						console.log({ error })
					})}
				>
					<div className="flex flex-col gap-5 py-5">{children}</div>
				</form>
			</Form>
			<label className="px-5 text-lg font-bold">Content</label>
			<CodemirrorEditor
				partykitUrl={hostUrl}
				roomName={`${resource.id}`}
				value={resource.fields?.body || ''}
				onChange={async (data) => {
					form.setValue('body', data)
				}}
			/>
			<ResourceChatAssistant
				resource={resource}
				availableWorkflows={availableWorkflows}
				sendResourceChatMessage={sendResourceChatMessage}
				hostUrl={hostUrl}
			/>
		</>
	)
}
