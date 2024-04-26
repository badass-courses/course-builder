'use client'

import * as React from 'react'
import { DateTimePicker } from '@/app/(content)/events/[slug]/edit/_components/date-time-picker/date-time-picker'
import { onEventSave } from '@/app/(content)/events/[slug]/edit/actions'
import { ImageResourceUploader } from '@/components/image-uploader/image-resource-uploader'
import { env } from '@/env.mjs'
import { sendResourceChatMessage } from '@/lib/ai-chat-query'
import { Event, EventSchema } from '@/lib/events'
import { ProductContentSchema } from '@/lib/products'
import { updateResource } from '@/lib/resources-query'
import { User } from '@auth/core/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { parseAbsolute } from '@internationalized/date'
import { ImagePlusIcon } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { Schema, z } from 'zod'

import { Product, productSchema } from '@coursebuilder/core/schemas'
import { ContentResource } from '@coursebuilder/core/types'
import {
	Button,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	ResizableHandle,
} from '@coursebuilder/ui'
import { EditResourcesActionBar } from '@coursebuilder/ui/resources-crud/edit-resources-action-bar'
import { EditResourcesMetadataFields } from '@coursebuilder/ui/resources-crud/edit-resources-metadata-fields'
import {
	EditResourcesToolPanel,
	ResourceTool,
} from '@coursebuilder/ui/resources-crud/edit-resources-tool-panel'
import { EditResourcePanelGroup } from '@coursebuilder/ui/resources-crud/panels/edit-resource-panel-group'
import { EditResourcesBodyPanel } from '@coursebuilder/ui/resources-crud/panels/edit-resources-body-panel'
import { EditResourcesMetadataPanel } from '@coursebuilder/ui/resources-crud/panels/edit-resources-metadata-panel'

export function EditProductForm({ product }: { product: Product }) {
	const { data: session } = useSession()
	const { theme } = useTheme()
	const form = useForm<z.infer<typeof productSchema>>({
		resolver: zodResolver(productSchema),
		defaultValues: {
			...product,
			fields: {
				description: product.fields.description ?? '',
				slug: product.fields.slug ?? '',
			},
		},
	})

	return (
		<EditProductFormDesktop
			product={product}
			form={form}
			resourceSchema={productSchema}
			getResourcePath={(slug?: string) => `/events/${slug}`}
			updateResource={updateResource}
			onSave={onEventSave}
			availableWorkflows={[]}
			sendResourceChatMessage={sendResourceChatMessage}
			hostUrl={env.NEXT_PUBLIC_PARTYKIT_ROOM_NAME}
			user={session?.user}
			tools={[
				{
					id: 'media',
					icon: () => (
						<ImagePlusIcon strokeWidth={1.5} size={24} width={18} height={18} />
					),
					toolComponent: (
						<ImageResourceUploader
							belongsToResourceId={product.id}
							uploadDirectory={`events`}
						/>
					),
				},
			]}
			theme={theme}
		>
			<FormField
				control={form.control}
				name="name"
				render={({ field }) => {
					return (
						<FormItem className="px-5">
							<FormLabel className="text-lg font-bold">Name</FormLabel>
							<FormDescription className="mt-2 text-sm">
								A name should summarize the product and explain what it is about
								succinctly.
							</FormDescription>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)
				}}
			/>
			<FormField
				control={form.control}
				name="quantityAvailable"
				render={({ field }) => {
					return (
						<FormItem className="px-5">
							<FormLabel className="text-lg font-bold">
								Quantity Available
							</FormLabel>
							<FormDescription className="mt-2 text-sm">
								The number of items that can be purchased at one time.
							</FormDescription>
							<FormControl>
								<Input type="number" min={-1} {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)
				}}
			/>
			<FormField
				control={form.control}
				name="price.unitAmount"
				render={({ field }) => {
					return (
						<FormItem className="px-5">
							<FormLabel className="text-lg font-bold">Price</FormLabel>
							<FormDescription className="mt-2 text-sm">
								The price of the product in USD.
							</FormDescription>
							<FormControl>
								<Input type="number" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)
				}}
			/>
		</EditProductFormDesktop>
	)
}

function EditProductFormDesktop({
	product,
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
	theme = 'light',
}: {
	onSave: (resource: ContentResource) => Promise<void>
	product: Product & {
		fields: {
			body?: string | null
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
	theme?: string
}) {
	const onSubmit = async (values: z.infer<typeof resourceSchema>) => {
		const updatedResource = await updateResource(values)
		if (updatedResource) {
			onSave(updatedResource)
		}
	}

	return (
		<>
			<EditProductActionBar
				resource={product}
				resourcePath={getResourcePath(product.fields?.slug)}
				onSubmit={() => {
					onSubmit(form.getValues())
				}}
				onPublish={() => {
					form.setValue('fields.state', 'published')
					onSubmit(form.getValues())
				}}
				onArchive={() => {
					form.setValue('fields.state', 'archived')
					onSubmit(form.getValues())
				}}
				onUnPublish={() => {
					form.setValue('fields.state', 'draft')
					onSubmit(form.getValues())
				}}
			/>
			<EditResourcePanelGroup>
				<EditResourcesMetadataPanel form={form} onSubmit={onSubmit}>
					{children}
				</EditResourcesMetadataPanel>
				<ResizableHandle />
				<EditResourcesBodyPanel
					partykitUrl={hostUrl}
					resource={product}
					form={form}
					theme={theme}
				/>
				<ResizableHandle />
				<EditResourcesToolPanel
					resource={{ ...product, ...form.getValues() }}
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

function EditProductActionBar({
	onSubmit,
	resource,
	resourcePath,
	onPublish,
	onArchive,
	onUnPublish,
}: {
	resource: Product
	onSubmit: () => void
	onPublish: () => void
	onUnPublish: () => void
	onArchive: () => void
	resourcePath: string
}) {
	return (
		<div className="md:bg-muted bg-muted/60 sticky top-0 z-10 flex h-9 w-full items-center justify-between px-1 backdrop-blur-md md:backdrop-blur-none">
			<div className="flex items-center gap-2">
				<Button className="px-0" asChild variant="link">
					<a href={resourcePath} className="aspect-square">
						←
					</a>
				</Button>
				<span className="font-medium">
					PRODUCT{' '}
					<span className="hidden font-mono text-xs font-normal md:inline-block">
						({resource.id})
					</span>
				</span>
			</div>
			<div className="flex items-center gap-2">
				{resource.fields?.state === 'draft' && (
					<Button
						onClick={(e) => {
							onPublish()
						}}
						type="button"
						variant="default"
						size="sm"
						className="h-7 disabled:cursor-wait"
					>
						Save & Publish
					</Button>
				)}
				{resource.fields?.state === 'published' && (
					<Button
						onClick={(e) => {
							onArchive()
						}}
						type="button"
						variant="default"
						size="sm"
						className="h-7 disabled:cursor-wait"
					>
						Archive
					</Button>
				)}
				{resource.fields?.state === 'published' && (
					<Button
						onClick={(e) => {
							onUnPublish()
						}}
						type="button"
						variant="default"
						size="sm"
						className="h-7 disabled:cursor-wait"
					>
						Return to Draft
					</Button>
				)}
				<Button
					onClick={(e) => {
						onSubmit()
					}}
					type="button"
					variant="default"
					size="sm"
					className="h-7 disabled:cursor-wait"
				>
					Save
				</Button>
			</div>
		</div>
	)
}
