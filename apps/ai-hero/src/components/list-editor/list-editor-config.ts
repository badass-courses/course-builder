import { PostType } from '@/lib/posts'
import { z } from 'zod'

import { ContentResource } from '@coursebuilder/core/schemas'

/**
 * Configuration for list resource selection
 * @interface ListResourceSelectionConfig
 */
export interface ListResourceSelectionConfig {
	/** Available resource types that can be selected */
	availableResourceTypes: PostType[]
	/** Default resource type for new resources */
	defaultResourceType: PostType
	/** Title for the create resource modal */
	createResourceTitle?: string
	/** Whether to show tier selector */
	showTierSelector?: boolean
	/** Custom search configuration component */
	searchConfig?: React.ReactNode
}

/**
 * Configuration for list editor functionality
 * @interface ListEditorConfig
 */
export interface ListEditorConfig {
	/** Resource selection configuration */
	selection: ListResourceSelectionConfig
	/** Custom title component */
	title?: React.ReactNode
	/** Function to handle resource addition */
	onResourceAdd?: (resource: ContentResource) => Promise<void>
	/** Function to handle resource removal */
	onResourceRemove?: (resourceId: string) => Promise<void>
	/** Function to handle resource reordering */
	onResourceReorder?: (resourceId: string, newPosition: number) => Promise<void>
}

/**
 * Default configuration for list editor
 */
export const defaultListEditorConfig: ListEditorConfig = {
	selection: {
		availableResourceTypes: ['article'],
		defaultResourceType: 'article',
		createResourceTitle: 'Create a Resource',
		showTierSelector: false,
	},
}

/**
 * Schema for validating list editor configuration
 */
export const ListEditorConfigSchema = z.object({
	selection: z.object({
		availableResourceTypes: z.array(z.string()),
		defaultResourceType: z.string(),
		createResourceTitle: z.string().optional(),
		showTierSelector: z.boolean().optional(),
	}),
	title: z.any().optional(),
	onResourceAdd: z.function().optional(),
	onResourceRemove: z.function().optional(),
	onResourceReorder: z.function().optional(),
})

/**
 * Creates a list editor configuration with defaults
 * @param config Partial list editor configuration
 * @returns Complete list editor configuration
 */
export function createListEditorConfig(
	config: Partial<ListEditorConfig>,
): ListEditorConfig {
	return {
		...defaultListEditorConfig,
		...config,
		selection: {
			...defaultListEditorConfig.selection,
			...config.selection,
		},
	}
}
