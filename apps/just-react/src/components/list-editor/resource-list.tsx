import React, { createContext, useContext } from 'react'

import type { TreeItem } from './lesson-list/data/tree'

/**
 * ResourceListContextValue
 *
 * Provides optional callbacks or shared data for items in the list,
 * like onRemove, onExpand, or onRename, etc.
 */
interface ResourceListContextValue {
	onRemove?: (id: string) => void
	onExpand?: (id: string) => void
	// Add any other "shared actions" you want here.
}

/**
 * ResourceListContext
 *
 * Any items in the ResourceList can access this context for shared actions or data.
 */
const ResourceListContext = createContext<ResourceListContextValue>({})

/**
 * ResourceListSlots
 *
 * This collects the "slots" or render props you can pass into ResourceList.
 */
interface ResourceListSlots {
	beforeAllItems?: () => React.ReactNode
	afterAllItems?: () => React.ReactNode
	beforeEachItem?: (item: TreeItem, index: number) => React.ReactNode
	itemRenderer?: (
		item: TreeItem,
		index: number,
		ctx: ResourceListContextValue,
	) => React.ReactNode
	afterEachItem?: (item: TreeItem, index: number) => React.ReactNode
	emptyStateRenderer?: () => React.ReactNode
}

/**
 * ResourceListProps
 *
 * @param {TreeItem[]} resources - The data you want to render as a list (could be anything: lessons, sections, etc.)
 * @param {Function} [itemRenderer] - A render function for each resource. Must return a React node.
 * @param {Function} [onRemove] - Optional callback if users remove an item.
 * @param {Function} [onExpand] - Optional callback if users expand/collapse an item.
 */
interface ResourceListProps extends ResourceListSlots {
	resources: TreeItem[]
	className?: string
	onRemove?: (id: string) => void
	onExpand?: (id: string) => void
}

/**
 * ResourceList Component
 *
 * Creates a flexible list of resources with multiple injection points (slots)
 * that let you add content before/after the entire list, or before/after each item.
 *
 * Features:
 * - Flexible slot system for custom content injection
 * - Custom item rendering
 * - Empty state handling
 * - Resource removal and expansion
 * - Context-based state management
 *
 * @component
 * @param {Object} props - Component props
 * @param {ContentResource[]} props.resources - Array of resources to display
 * @param {string} [props.className] - Optional CSS class name
 * @param {() => React.ReactNode} [props.beforeAllItems] - Content to render before all items
 * @param {() => React.ReactNode} [props.afterAllItems] - Content to render after all items
 * @param {(item: ContentResource, index: number) => React.ReactNode} [props.beforeEachItem] - Content to render before each item
 * @param {(item: ContentResource, index: number) => React.ReactNode} [props.afterEachItem] - Content to render after each item
 * @param {(item: ContentResource, index: number, context: ResourceListContext) => React.ReactNode} [props.itemRenderer] - Custom item renderer
 * @param {() => React.ReactNode} [props.emptyStateRenderer] - Content to render when list is empty
 * @param {(resourceId: string) => void} [props.onRemove] - Callback when a resource is removed
 * @param {(resourceId: string) => void} [props.onExpand] - Callback when a resource is expanded
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ResourceList
 *   resources={items}
 *   className="my-list"
 *   itemRenderer={(item) => <CustomItem item={item} />}
 * />
 *
 * // Advanced usage with slots
 * <ResourceList
 *   resources={items}
 *   beforeAllItems={() => <Header />}
 *   beforeEachItem={(item) => <ItemHeader item={item} />}
 *   afterEachItem={(item) => <ItemFooter item={item} />}
 *   afterAllItems={() => <Footer />}
 *   emptyStateRenderer={() => <EmptyState />}
 *   onRemove={(id) => handleRemove(id)}
 *   onExpand={(id) => handleExpand(id)}
 * />
 * ```
 */
export function ResourceList({
	resources,
	className,
	beforeAllItems,
	afterAllItems,
	beforeEachItem,
	itemRenderer,
	afterEachItem,
	emptyStateRenderer,
	onRemove,
	onExpand,
}: ResourceListProps) {
	const contextValue = { onRemove, onExpand }

	// If there are no items and a custom empty state slot is provided
	if (!resources.length && emptyStateRenderer) {
		return <>{emptyStateRenderer()}</>
	}

	return (
		<ResourceListContext.Provider value={contextValue}>
			<div className={className}>
				{/* Optional slot before all items */}
				{beforeAllItems?.()}

				{/* Render each item */}
				{resources.map((item, index) => (
					<div key={item.id}>
						{beforeEachItem?.(item, index)}
						{itemRenderer ? (
							itemRenderer(item, index, contextValue)
						) : (
							<DefaultResourceItem item={item} />
						)}
						{afterEachItem?.(item, index)}
					</div>
				))}

				{/* Optional slot after all items */}
				{afterAllItems?.()}
			</div>
		</ResourceListContext.Provider>
	)
}

/**
 * DefaultResourceItem
 *
 * A fallback for when "itemRenderer" is not passed in.
 * This can be styled or extended if you want a minimal default.
 */
function DefaultResourceItem({ item }: { item: TreeItem }) {
	// Access context if we want to wire up interactions
	const { onRemove, onExpand } = useContext(ResourceListContext)

	return (
		<div className="flex justify-between rounded-sm border p-2">
			<span>{item.label ?? item.id}</span>
			<div className="flex gap-2">
				{onExpand && (
					<button type="button" onClick={() => onExpand(item.id)}>
						Toggle
					</button>
				)}
				{onRemove && (
					<button type="button" onClick={() => onRemove(item.id)}>
						Remove
					</button>
				)}
			</div>
		</div>
	)
}

/**
 * Custom hook to consume resource list context.
 * Provides access to resource list operations like removal and expansion.
 *
 * @returns {ResourceListContext} The resource list context
 *
 * @example
 * ```tsx
 * function ResourceItem() {
 *   const { onRemove, onExpand } = useResourceListContext()
 *
 *   return (
 *     <div>
 *       <button onClick={() => onRemove(id)}>Remove</button>
 *       <button onClick={() => onExpand(id)}>Expand</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useResourceListContext() {
	return useContext(ResourceListContext)
}
