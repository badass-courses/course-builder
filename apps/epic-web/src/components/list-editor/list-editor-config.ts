import { z } from 'zod'

import { ContentResource } from '@coursebuilder/core/schemas'

/**
 * Configuration for list resource selection and filtering.
 * Controls what types of resources can be added to a list and how they are selected.
 *
 * @interface ListResourceSelectionConfig
 *
 * @example
 * ```typescript
 * const selectionConfig: ListResourceSelectionConfig = {
 *   availableResourceTypes: ['article', 'video', 'workshop'],
 *   defaultResourceType: 'article',
 *   showTierSelector: true
 * }
 * ```
 */
export interface ListResourceSelectionConfig {
	/** Available resource types that can be selected */
	availableResourceTypes: string[]
	/** Default resource type for new resources */
	defaultResourceType: string
	/** Title for the create resource modal */
	createResourceTitle?: string
	/** Whether to show tier selector (standard/premium) */
	showTierSelector?: boolean
	/** Custom search configuration component */
	searchConfig?: React.ReactNode
	/** Top-level resource types (not post subtypes) */
	topLevelResourceTypes?: string[]
}

/**
 * Configuration for list editor functionality.
 * Defines how the list editor behaves, including resource selection,
 * organization, and event handling.
 *
 * Features:
 * - Resource type filtering
 * - Drag-and-drop reordering
 * - Tier-based organization
 * - Custom search configuration
 * - Resource CRUD operations
 *
 * @interface ListEditorConfig
 *
 * @example
 * ```typescript
 * const listEditorConfig: ListEditorConfig = {
 *   selection: {
 *     availableResourceTypes: ['article'],
 *     defaultResourceType: 'article',
 *     showTierSelector: true
 *   },
 *   title: <CustomTitle />,
 *   onResourceAdd: async (resource) => {
 *     // Handle resource addition
 *   }
 * }
 * ```
 */
export interface ListEditorConfig {
	/** Resource selection configuration */
	selection: ListResourceSelectionConfig
	/** Custom title component */
	title?: React.ReactNode
	/**
	 * Function to handle resource addition
	 * @param {ContentResource} resource - The resource being added
	 * @returns {Promise<void>}
	 */
	onResourceAdd?: (resource: ContentResource) => Promise<void>
	/**
	 * Function to handle resource removal
	 * @param {string} resourceId - ID of the resource to remove
	 * @returns {Promise<void>}
	 */
	onResourceRemove?: (resourceId: string) => Promise<void>
	/**
	 * Function to handle resource reordering
	 * @param {string} resourceId - ID of the resource being reordered
	 * @param {number} newPosition - New position in the list
	 * @returns {Promise<void>}
	 */
	onResourceReorder?: (resourceId: string, newPosition: number) => Promise<void>
	/**
	 * Function to handle item updating
	 * @param {string} itemId - ID of the item being updated
	 * @param {Record<string, any>} fields - Fields to update
	 * @returns {Promise<void>}
	 */
	onResourceUpdate?: (
		itemId: string,
		fields: Record<string, any>,
	) => Promise<void>
}
/**
 * Default configuration for list editor.
 * Provides sensible defaults for a basic list editor setup.
 *
 * @example
 * ```typescript
 * const config = createListEditorConfig({
 *   selection: {
 *     availableResourceTypes: ['video']
 *   }
 * })
 * ```
 */
export const defaultListEditorConfig: ListEditorConfig = {
	selection: {
		availableResourceTypes: ['article', 'lesson'],
		defaultResourceType: 'article',
		createResourceTitle: 'Create a Resource',
		showTierSelector: false,
	},
}

/**
 * Schema for validating list editor configuration.
 * Uses Zod for runtime type checking of configuration objects.
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
	onResourceUpdate: z.function().optional(),
})

/**
 * Creates a list editor configuration with defaults.
 * Merges provided configuration with default values.
 *
 * @param {Partial<ListEditorConfig>} config - Partial configuration to merge with defaults
 * @returns {ListEditorConfig} Complete list editor configuration
 *
 * @example
 * ```typescript
 * const config = createListEditorConfig({
 *   selection: {
 *     showTierSelector: true
 *   }
 * })
 * ```
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
