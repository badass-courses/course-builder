'use client'

import * as React from 'react'
import { useReducer } from 'react'
import { useRouter } from 'next/navigation'
import { onProductSave } from '@/app/(commerce)/products/[slug]/edit/actions'
import { ImageResourceUploader } from '@/components/image-uploader/image-resource-uploader'
import LayoutClient from '@/components/layout-client'
import {
	getInitialTreeState,
	treeStateReducer,
} from '@/components/list-editor/lesson-list/data/tree'
import Tree from '@/components/list-editor/lesson-list/tree'
import { env } from '@/env.mjs'
import { sendResourceChatMessage } from '@/lib/ai-chat-query'
import {
	addResourceToProduct,
	archiveProduct,
	updateProduct,
} from '@/lib/products-query'
import { api } from '@/trpc/react'
import { User } from '@auth/core/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { parseAbsolute } from '@internationalized/date'
import { ChevronsUpDown, ImagePlusIcon } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { Schema, z } from 'zod'

import { Product, productSchema } from '@coursebuilder/core/schemas'
import type { ContentResource } from '@coursebuilder/core/schemas'
import { ContentResourceProduct } from '@coursebuilder/core/schemas/content-resource-schema'
import {
	Button,
	DateTimePicker,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	Popover,
	PopoverContent,
	PopoverTrigger,
	ResizableHandle,
	ResizablePanel,
	ScrollArea,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Textarea,
} from '@coursebuilder/ui'
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
} from '@coursebuilder/ui/primitives/command'
import {
	EditResourcesToolPanel,
	ResourceTool,
} from '@coursebuilder/ui/resources-crud/edit-resources-tool-panel'
import { MetadataFieldState } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-state'
import { MetadataFieldVisibility } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-visibility'
import { EditResourcePanelGroup } from '@coursebuilder/ui/resources-crud/panels/edit-resource-panel-group'
import { EditResourcesBodyPanel } from '@coursebuilder/ui/resources-crud/panels/edit-resources-body-panel'
import { EditResourcesMetadataPanel } from '@coursebuilder/ui/resources-crud/panels/edit-resources-metadata-panel'

function ComboboxDemo({
	onSelect,
	currentResources = [],
}: {
	onSelect: (value?: ContentResource | null) => void
	currentResources: ContentResourceProduct[]
}) {
	const [open, setOpen] = React.useState(false)

	const { data = [] } = api.contentResources.getAll.useQuery({
		contentTypes: ['post', 'event', 'workshop', 'cohort'],
	})

	const filteredResources = data
		.filter(
			(resource) =>
				!currentResources
					.map((currentResource) => currentResource.resourceId)
					.includes(resource.id),
		)
		.sort(
			(a, b) => (a.updatedAt?.getTime() || 0) - (b.updatedAt?.getTime() || 0),
		)

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-full justify-between"
				>
					Select resource...
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[200px] p-0">
				<Command>
					<CommandInput placeholder="Search resources..." />
					<CommandEmpty>No resources found.</CommandEmpty>
					<CommandGroup>
						{filteredResources.map((resource) => (
							<CommandItem
								key={resource.id}
								value={resource.id}
								onSelect={(currentValue) => {
									onSelect(
										data.find((resource) => resource.id === currentValue),
									)
									setOpen(false)
								}}
							>
								{/*<Check*/}
								{/*	className={cn(*/}
								{/*		'mr-2 h-4 w-4',*/}
								{/*		value === resource.id ? 'opacity-100' : 'opacity-0',*/}
								{/*	)}*/}
								{/*/>*/}
								{resource.fields?.title} ({resource.type})
							</CommandItem>
						))}
					</CommandGroup>
				</Command>
			</PopoverContent>
		</Popover>
	)
}

export function EditProductForm({ product }: { product: Product }) {
	const { data: session } = useSession()
	const { resolvedTheme } = useTheme()
	const form = useForm<z.infer<typeof productSchema>>({
		resolver: zodResolver(productSchema),
		defaultValues: {
			...product,
			fields: {
				...product.fields,
				description: product.fields.description ?? '',
				slug: product.fields.slug ?? '',
				image: {
					url: product.fields.image?.url ?? '',
				},
				visibility: product.fields.visibility || 'public',
				state: product.fields.state || 'draft',
				openEnrollment: product.fields.openEnrollment
					? new Date(product.fields.openEnrollment).toISOString()
					: null,
				closeEnrollment: product.fields.closeEnrollment
					? new Date(product.fields.closeEnrollment).toISOString()
					: null,
				discordRoleId: product.fields.discordRoleId ?? '',
				billingInterval: product.fields.billingInterval ?? 'year',
				tier: product.fields.tier ?? 'standard',
			},
		},
	})

	const initialData = [
		...(product.resources
			? product.resources.map((resourceItem) => {
					if (!resourceItem.resource) {
						throw new Error('resourceItem.resource is required')
					}
					const resources = resourceItem.resource.resources ?? []
					return {
						id: resourceItem.resource.id,
						label: resourceItem.resource.fields?.title,
						type: resourceItem.resource.type,
						children: [],
						itemData: resourceItem as any,
					}
				})
			: []),
	]

	const [state, updateState] = useReducer(
		treeStateReducer,
		initialData,
		getInitialTreeState,
	)

	const router = useRouter()

	const handleResourceAdded = async (resource?: ContentResource | null) => {
		if (!resource) return
		const resourceItem = await addResourceToProduct({
			resource,
			productId: product.id,
		})

		if (resourceItem) {
			updateState({
				type: 'add-item',
				itemId: resourceItem.resourceId,
				item: {
					id: resourceItem.resourceId,
					label: resourceItem.resource.fields?.title,
					type: resourceItem.resource.type,
					children: [],
					itemData: resourceItem as any,
				},
			})
		}
		router.refresh()
	}

	return (
		<EditProductFormDesktop
			product={product}
			form={form}
			resourceSchema={productSchema}
			getResourcePath={(slug?: string) => `/products/${slug}`}
			updateResource={updateProduct}
			onSave={onProductSave}
			availableWorkflows={[]}
			sendResourceChatMessage={sendResourceChatMessage}
			hostUrl={env.NEXT_PUBLIC_URL}
			user={session?.user}
			tools={[
				{ id: 'assistant' },
				{
					id: 'media',
					icon: () => (
						<ImagePlusIcon strokeWidth={1.5} size={24} width={18} height={18} />
					),
					toolComponent: (
						<ImageResourceUploader
							key={'image-uploader'}
							belongsToResourceId={product.id}
							uploadDirectory={`products`}
						/>
					),
				},
			]}
			theme={resolvedTheme}
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
				name="type"
				render={({ field }) => {
					return (
						<FormItem className="px-5">
							<FormLabel className="text-lg font-bold">Type</FormLabel>
							<FormDescription className="mt-2 text-sm">
								What type of product is this? Live or self-paced?
							</FormDescription>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<FormControl>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select product type..." />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value="live">Live</SelectItem>
									<SelectItem value="self-paced">Self-paced</SelectItem>
									<SelectItem value="membership">Membership</SelectItem>
									<SelectItem value="cohort">Cohort</SelectItem>
									<SelectItem value="source-code-access">
										Source Code Access
									</SelectItem>
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)
				}}
			/>
			{/* Membership-specific fields */}
			{form.watch('type') === 'membership' && (
				<>
					<FormField
						control={form.control}
						name="fields.billingInterval"
						render={({ field }) => {
							return (
								<FormItem className="px-5">
									<FormLabel className="text-lg font-bold">
										Billing Interval
									</FormLabel>
									<FormDescription className="mt-2 text-sm">
										How often should subscribers be billed?
									</FormDescription>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value || 'year'}
									>
										<FormControl>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select billing interval..." />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="month">Monthly</SelectItem>
											<SelectItem value="year">Yearly</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)
						}}
					/>
					<FormField
						control={form.control}
						name="fields.tier"
						render={({ field }) => {
							return (
								<FormItem className="px-5">
									<FormLabel className="text-lg font-bold">
										Subscription Tier
									</FormLabel>
									<FormDescription className="mt-2 text-sm">
										What tier of access does this membership grant? Pro
										subscribers can access all content including pro-tier
										resources.
									</FormDescription>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value || 'standard'}
									>
										<FormControl>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select tier..." />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="standard">Standard</SelectItem>
											<SelectItem value="pro">Pro</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)
						}}
					/>
				</>
			)}
			<FormField
				control={form.control}
				name="fields.openEnrollment"
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel className="text-lg font-bold">Open Enrollment</FormLabel>
						<DateTimePicker
							{...field}
							value={
								!!field.value
									? parseAbsolute(
											new Date(field.value).toISOString(),
											'America/Los_Angeles',
										)
									: null
							}
							onChange={(date) => {
								field.onChange(
									!!date ? date.toDate('America/Los_Angeles') : null,
								)
							}}
							shouldCloseOnSelect={false}
							granularity="minute"
						/>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="fields.closeEnrollment"
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel className="text-lg font-bold">
							Close Enrollment
						</FormLabel>
						<DateTimePicker
							{...field}
							value={
								!!field.value
									? parseAbsolute(
											new Date(field.value).toISOString(),
											'America/Los_Angeles',
										)
									: null
							}
							onChange={(date) => {
								field.onChange(
									!!date ? date.toDate('America/Los_Angeles') : null,
								)
							}}
							shouldCloseOnSelect={false}
							granularity="minute"
						/>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="fields.discordRoleId"
				render={({ field }) => {
					return (
						<FormItem className="px-5">
							<FormLabel className="text-lg font-bold">
								Discord Role ID
							</FormLabel>
							<FormDescription className="mt-2 text-sm">
								The ID of the Discord role that will be added to the user when
								they purchase the product.
							</FormDescription>
							<FormControl>
								<Input {...field} value={field.value ?? ''} />
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
			<div className="flex flex-col gap-3 px-5">
				<div className="text-lg font-bold">Product Resources</div>
				<ComboboxDemo
					onSelect={(value) => {
						handleResourceAdded(value)
					}}
					currentResources={product.resources || []}
				/>
			</div>
			<Tree
				rootResource={product}
				rootResourceId={product.id}
				state={state}
				updateState={updateState}
			/>
			<FormField
				control={form.control}
				name="fields.description"
				render={({ field }) => {
					return (
						<FormItem className="px-5">
							<FormLabel className="text-lg font-bold">Description</FormLabel>
							<FormDescription className="mt-2 text-sm">
								The product’s description, meant to be displayable to the
								customer. Use this field to optionally store a long form
								explanation of the product being sold for your own rendering
								purposes.
							</FormDescription>
							<FormControl>
								<Textarea {...field} value={field.value || ''} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)
				}}
			/>
			<FormField
				control={form.control}
				name="fields.image.url"
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel className="text-lg font-bold">Image</FormLabel>
						<FormDescription>Preview</FormDescription>
						{form.watch('fields.image.url') && (
							<img
								src={form.watch('fields.image.url')}
								alt={'image preview'}
								className="w-full rounded-md border"
							/>
						)}
						<div className="flex items-center gap-1">
							<Input
								{...field}
								onDrop={(e) => {
									console.log(e)
									const result = e.dataTransfer.getData('text/plain')
									const parsedResult = result.match(/\(([^)]+)\)/)
									if (parsedResult) {
										field.onChange(parsedResult[1])
									}
								}}
								value={field.value?.toString()}
							/>
						</div>
					</FormItem>
				)}
			/>
			<MetadataFieldVisibility form={form} />
			<MetadataFieldState form={form} />
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
	onSave: (resource: { fields: Record<string, any> | null }) => Promise<void>
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

	const onArchive = async (values: z.infer<typeof resourceSchema>) => {
		const updatedResource = await archiveProduct(values)
		if (updatedResource) {
			onSave(updatedResource)
		}
	}

	return (
		<LayoutClient>
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
					onArchive(form.getValues())
				}}
				onUnPublish={() => {
					form.setValue('fields.state', 'draft')
					onSubmit(form.getValues())
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
				<ResizablePanel
					id="edit-resources-body-panel"
					// order={isShowingMdxPreview ? 3 : 2}
					order={2}
					defaultSize={55}
					className="flex min-h-full md:min-h-full"
				>
					<ScrollArea className="h-(--pane-layout-height) flex w-full flex-col justify-start overflow-y-auto">
						<EditResourcesBodyPanel
							user={user}
							partykitUrl={hostUrl}
							resource={product}
							form={form}
							theme={theme}
						/>
					</ScrollArea>
				</ResizablePanel>
				{/* <ResizableHandle /> */}
				<EditResourcesToolPanel
					resource={{ ...product, ...form.getValues() }}
					availableWorkflows={availableWorkflows}
					sendResourceChatMessage={sendResourceChatMessage}
					hostUrl={hostUrl}
					user={user}
					tools={tools}
				/>
			</EditResourcePanelGroup>
		</LayoutClient>
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
