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
 * ResourceListProps
 *
 * @param {TreeItem[]} resources - The data you want to render as a list (could be anything: lessons, sections, etc.)
 * @param {Function} [itemRenderer] - A render function for each resource. Must return a React node.
 * @param {Function} [onRemove] - Optional callback if users remove an item.
 * @param {Function} [onExpand] - Optional callback if users expand/collapse an item.
 */
interface ResourceListProps {
	resources: TreeItem[]
	itemRenderer?: (
		item: TreeItem,
		index: number,
		ctx: ResourceListContextValue,
	) => React.ReactNode
	onRemove?: (id: string) => void
	onExpand?: (id: string) => void
}

/**
 * ResourceList
 *
 * Creates a flexible list of resources. The "itemRenderer" prop determines
 * how each resource is displayed. Other props, like "onRemove" or "onExpand,"
 * are provided via context to each item if needed.
 */
export function ResourceList({
	resources,
	itemRenderer,
	onRemove,
	onExpand,
}: ResourceListProps) {
	const contextValue = { onRemove, onExpand }

	return (
		<ResourceListContext.Provider value={contextValue}>
			<div className="space-y-2">
				{resources.map((item, index) => {
					if (itemRenderer) {
						// Give the itemRenderer everything it needs
						return (
							<div key={item.id}>{itemRenderer(item, index, contextValue)}</div>
						)
					}
					// Otherwise, use our fallback
					return <DefaultResourceItem key={item.id} item={item} />
				})}
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
