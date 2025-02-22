import * as React from 'react'
import { ImageResourceUploader } from '@/components/image-uploader/image-resource-uploader'
import ListResourcesEdit from '@/components/list-editor/list-resources-edit'
import { env } from '@/env.mjs'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { sendResourceChatMessage } from '@/lib/ai-chat-query'
import { PostType } from '@/lib/posts'
import { zodResolver } from '@hookform/resolvers/zod'
import { ImagePlusIcon } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import { ContentResource } from '@coursebuilder/core/schemas'
import { EditResourcesFormDesktop } from '@coursebuilder/ui/resources-crud/edit-resources-form-desktop'
import { EditResourcesFormMobile } from '@coursebuilder/ui/resources-crud/edit-resources-form-mobile'
import { ResourceTool } from '@coursebuilder/ui/resources-crud/edit-resources-tool-panel'

/**
 * Base fields required for all resource types
 * @interface BaseResourceFields
 */
export interface BaseResourceFields {
	body?: string | null
	title?: string | null
	slug: string
	visibility?: string
	state?: string
	description?: string | null
}

/**
 * Base configuration for resource tools
 * @interface BaseTool
 */
export type BaseTool = {
	id: string
	label?: string
	icon?: () => React.ReactElement
	toolComponent?: React.ReactElement
}

/**
 * Configuration for resource form functionality
 * @interface ResourceFormConfig
 * @template T - Resource type extending ContentResource with BaseResourceFields
 * @template S - Zod schema for form validation
 */
export interface ResourceFormConfig<
	T extends ContentResource & {
		fields: BaseResourceFields
	},
	S extends z.ZodSchema,
> {
	/** Type of resource being edited */
	resourceType: 'cohort' | 'list' | 'page' | 'post' | 'tutorial' | 'workshop'
	/** Zod schema for form validation */
	schema: S
	/** Function to generate default form values */
	defaultValues: (resource?: T) => z.infer<S>
	/** Configuration for creating new posts */
	createPostConfig?: {
		title: string
		defaultResourceType: PostType
		availableResourceTypes: PostType[]
	}
	/** Additional tools to be displayed in the resource editor */
	customTools?: BaseTool[]
	/** Function to generate resource URL path */
	getResourcePath: (slug?: string) => string
	/** Function to update resource data */
	updateResource: (resource: Partial<T>) => Promise<T>
	/** Optional function for automatic resource updates */
	autoUpdateResource?: (resource: Partial<T>) => Promise<T>
	/** Optional callback after successful save */
	onSave?: (resource: ContentResource) => Promise<void>
	/** Configuration for the body panel */
	bodyPanelConfig?: {
		showListResources?: boolean
	}
}

/**
 * Props for resource form components
 * @interface ResourceFormProps
 * @template T - Resource type extending ContentResource
 * @template S - Zod schema for form validation
 */
export interface ResourceFormProps<
	T extends ContentResource,
	S extends z.ZodSchema,
> {
	resource: T
	form?: UseFormReturn<z.infer<S>>
}

/**
 * Default tools available in the resource editor
 */
const defaultTools: BaseTool[] = [
	{ id: 'assistant' },
	{
		id: 'media',
		icon: () => (
			<ImagePlusIcon strokeWidth={1.5} size={24} width={18} height={18} />
		),
	},
]

/**
 * Higher-order component that provides common resource form functionality
 * @template T - Resource type extending ContentResource with BaseResourceFields
 * @template S - Zod schema for form validation
 * @param {React.ComponentType<ResourceFormProps<T, S>>} Component - Component to wrap
 * @param {ResourceFormConfig<T, S>} config - Configuration for the resource form
 * @returns {React.FC<{resource: T}>} Wrapped component with resource form functionality
 */
export function withResourceForm<
	T extends ContentResource & {
		fields: BaseResourceFields
	},
	S extends z.ZodSchema,
>(
	Component: React.ComponentType<ResourceFormProps<T, S>>,
	config: ResourceFormConfig<T, S>,
) {
	return function ResourceForm({ resource }: { resource: T }) {
		const { data: session } = useSession()
		const { theme } = useTheme()
		const isMobile = useIsMobile()

		console.debug('withResourceForm resource:', {
			resource,
			fields: resource?.fields,
			id: resource?.id,
			type: resource?.type,
		})

		// Setup form with schema validation
		const form = useForm<z.infer<S>>({
			resolver: zodResolver(config.schema),
			defaultValues: config.defaultValues(resource),
		})

		// Choose form component based on device
		const ResourceFormComponent = isMobile
			? EditResourcesFormMobile
			: EditResourcesFormDesktop

		// Combine default and custom tools
		const tools = [
			...defaultTools,
			...(config.customTools?.map((tool) => ({
				...tool,
				toolComponent:
					tool.id === 'media' ? (
						<ImageResourceUploader
							key="image-uploader"
							belongsToResourceId={resource.id}
							uploadDirectory={`${config.resourceType}s`}
						/>
					) : (
						tool.toolComponent
					),
			})) ?? []),
		] as ResourceTool[]

		return (
			<ResourceFormComponent
				resource={resource}
				form={form}
				resourceSchema={config.schema}
				getResourcePath={config.getResourcePath}
				updateResource={config.updateResource}
				onSave={config.onSave}
				bodyPanelSlot={
					config.bodyPanelConfig?.showListResources ? (
						<ListResourcesEdit
							list={resource}
							createPostConfig={config.createPostConfig}
						/>
					) : null
				}
				availableWorkflows={[
					{
						value: `${config.resourceType}-chat-default`,
						label: `${config.resourceType.charAt(0).toUpperCase() + config.resourceType.slice(1)} Chat`,
						default: true,
					},
				]}
				sendResourceChatMessage={sendResourceChatMessage}
				hostUrl={env.NEXT_PUBLIC_PARTY_KIT_URL}
				user={session?.user}
				tools={tools}
				theme={theme}
			>
				<Component resource={resource} form={form} />
			</ResourceFormComponent>
		)
	}
}
