import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ResourceChatAssistant } from '@/components/chat-assistant/resource-chat-assistant'
import { CodemirrorEditor } from '@/components/codemirror'
import type { UseFormReturn } from 'react-hook-form'
import { Schema, z } from 'zod'

import { ContentResource } from '@coursebuilder/core/types'
import { Button, Form } from '@coursebuilder/ui'

export function EditResourcesFormMobile({
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
		const updatedResource = await updateResource(values)
		if (updatedResource) {
			router.push(getResourcePath(updatedResource.slug))
		}
	}

	return (
		<>
			<div className="md:bg-muted bg-muted/60 sticky top-0 z-10 flex h-9 w-full items-center justify-between px-1 backdrop-blur-md md:backdrop-blur-none">
				<div className="flex items-center gap-2">
					<Button className="px-0" asChild variant="link">
						<Link
							href={getResourcePath(resource.fields?.slug)}
							className="aspect-square"
						>
							←
						</Link>
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
				roomName={`${resource.id}`}
				value={resource.fields?.body || ''}
				onChange={async (data) => {
					form.setValue('body', data)
				}}
			/>
			<ResourceChatAssistant
				resource={resource}
				availableWorkflows={availableWorkflows}
			/>
		</>
	)
}
