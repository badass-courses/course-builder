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

export interface BaseResourceFields {
	body?: string | null
	title?: string | null
	slug: string
	visibility?: string
	state?: string
	description?: string | null
}

export type BaseTool = {
	id: string
	label?: string
	icon?: () => React.ReactElement
	toolComponent?: React.ReactElement
}

export interface ResourceFormConfig<
	T extends ContentResource & {
		fields: BaseResourceFields
	},
	S extends z.ZodSchema,
> {
	resourceType: 'cohort' | 'list' | 'page' | 'post' | 'tutorial' | 'workshop'
	schema: S
	defaultValues: (resource?: T) => z.infer<S>
	createPostConfig?: {
		title: string
		defaultResourceType: PostType
		availableResourceTypes: PostType[]
	}
	customTools?: BaseTool[]
	getResourcePath: (slug?: string) => string
	updateResource: (resource: Partial<T>) => Promise<T>
	autoUpdateResource?: (resource: Partial<T>) => Promise<T>
	onSave?: (resource: ContentResource) => Promise<void>
	bodyPanelConfig?: {
		showListResources?: boolean
	}
}

export interface ResourceFormProps<
	T extends ContentResource,
	S extends z.ZodSchema,
> {
	resource: T
	form?: UseFormReturn<z.infer<S>>
}

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
 * HOC that provides common resource form functionality
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
