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
 * Base fields required for all resource types in the system.
 * These fields are common across all resources and provide a consistent interface
 * for handling basic resource metadata.
 *
 * @interface BaseResourceFields
 * @property {string | null} [body] - The main content of the resource
 * @property {string | null} [title] - The display title of the resource
 * @property {string} slug - URL-friendly identifier for the resource
 * @property {string} [visibility] - Access control setting ('public', 'private', 'unlisted')
 * @property {string} [state] - Current state of the resource ('draft', 'published', etc.)
 * @property {string | null} [description] - Brief description of the resource
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
 * Configuration interface for resource form functionality.
 * This is the core configuration type that defines how a resource form behaves,
 * including validation, updates, and UI customization.
 *
 * @interface ResourceFormConfig
 * @template T - Resource type extending ContentResource with BaseResourceFields
 * @template S - Zod schema for form validation
 *
 * @example
 * ```typescript
 * const postFormConfig: ResourceFormConfig<Post, typeof PostSchema> = {
 *   resourceType: 'post',
 *   schema: PostSchema,
 *   defaultValues: (post) => ({
 *     title: post?.title ?? '',
 *     // ... other defaults
 *   }),
 *   updateResource: async (post) => {
 *     // Update logic
 *   }
 * }
 * ```
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

	/**
	 * Configuration for creating new posts within this resource
	 * @example
	 * ```typescript
	 * createPostConfig: {
	 *   title: 'Create New Article',
	 *   defaultResourceType: 'article',
	 *   availableResourceTypes: ['article', 'video']
	 * }
	 * ```
	 */
	createPostConfig?: {
		title: string
		defaultResourceType: PostType
		availableResourceTypes: PostType[]
	}

	/** Additional tools to be displayed in the resource editor */
	customTools?: BaseTool[]

	/** Function to generate resource URL path */
	getResourcePath: (slug?: string) => string

	/**
	 * Function to update resource data
	 * @throws {Error} When resource data is invalid or update fails
	 */
	updateResource: (resource: Partial<T>) => Promise<T>

	/**
	 * Optional function for automatic resource updates
	 * Used for auto-saving or background updates
	 */
	autoUpdateResource?: (resource: Partial<T>) => Promise<T>

	/** Optional callback after successful save */
	onSave?: (resource: ContentResource) => Promise<void>

	/**
	 * Configuration for the body panel
	 * Controls list resources display and configuration
	 */
	bodyPanelConfig?: {
		showListResources?: boolean
		listEditorConfig?: {
			title?: React.ReactNode
			searchConfig?: React.ReactNode
			showTierSelector?: boolean
			onResourceAdd?: (resource: ContentResource) => Promise<void>
			onResourceRemove?: (resourceId: string) => Promise<void>
			onResourceReorder?: (
				resourceId: string,
				newPosition: number,
			) => Promise<void>
		}
	}
}

/**
 * Props interface for resource form components
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
 * These tools are automatically included in every resource form
 */
const defaultTools: BaseTool[] = [{ id: 'assistant' }]

/**
 * Higher-order component that provides common resource form functionality.
 * This is the core building block for creating resource editing forms with
 * standardized behavior, validation, and UI components.
 *
 * Features:
 * - Type-safe form handling with Zod schema validation
 * - Mobile/desktop responsive form rendering
 * - Standardized tool panel integration
 * - List editor integration
 * - Resource chat capabilities
 * - Image upload support
 *
 * @template T - Resource type extending ContentResource with BaseResourceFields
 * @template S - Zod schema for form validation
 * @param {React.ComponentType<ResourceFormProps<T, S>>} Component - Component to wrap
 * @param {ResourceFormConfig<T, S>} config - Configuration for the resource form
 * @returns {React.FC<{resource: T}>} Wrapped component with resource form functionality
 *
 * @example
 * ```typescript
 * const PostForm = withResourceForm(
 *   BasePostForm,
 *   postFormConfig
 * )
 * ```
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
			...(config.customTools ?? []),
		] as ResourceTool[]

		return (
			<ResourceFormComponent
				resource={resource}
				form={form}
				resourceSchema={config.schema}
				getResourcePath={config.getResourcePath}
				updateResource={config.updateResource}
				autoUpdateResource={config.autoUpdateResource}
				onSave={config.onSave}
				bodyPanelSlot={
					config.bodyPanelConfig?.showListResources ? (
						<ListResourcesEdit
							list={resource}
							config={{
								selection: {
									availableResourceTypes: config.createPostConfig
										?.availableResourceTypes || ['article'],
									defaultResourceType:
										config.createPostConfig?.defaultResourceType || 'article',
									createResourceTitle: config.createPostConfig?.title,
									showTierSelector:
										config.bodyPanelConfig?.listEditorConfig?.showTierSelector,
									searchConfig:
										config.bodyPanelConfig?.listEditorConfig?.searchConfig,
								},
								title: config.bodyPanelConfig?.listEditorConfig?.title,
								onResourceAdd:
									config.bodyPanelConfig?.listEditorConfig?.onResourceAdd,
								onResourceRemove:
									config.bodyPanelConfig?.listEditorConfig?.onResourceRemove,
								onResourceReorder:
									config.bodyPanelConfig?.listEditorConfig?.onResourceReorder,
							}}
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
