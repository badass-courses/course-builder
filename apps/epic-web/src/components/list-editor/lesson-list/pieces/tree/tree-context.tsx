import React, { createContext } from 'react'
import {
	attachInstruction,
	extractInstruction,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item'

import { Product } from '@coursebuilder/core/schemas'
import type { ContentResource } from '@coursebuilder/core/schemas'

import type { TreeAction, TreeItem } from '../../data/tree'

export type TreeContextValue = {
	dispatch: (action: TreeAction) => void
	uniqueContextId: Symbol
	getPathToItem: (itemId: string) => string[]
	getMoveTargets: ({ itemId }: { itemId: string }) => TreeItem[]
	getChildrenOfItem: (itemId: string) => TreeItem[]
	rootResourceId: string | null
	rootResource: ContentResource | Product | null
	registerTreeItem: (args: {
		itemId: string
		element: HTMLElement
		actionMenuTrigger: HTMLElement
	}) => void
	/**
	 * Optional refresh mechanism, e.g. for search re-fetches.
	 */
	onRefresh?: () => void
	onResourceUpdate?: (
		itemId: string,
		fields: Record<string, any>,
	) => Promise<void>
	onResourceRemove?: (itemId: string, listId: string) => Promise<void>
}
export const TreeContext = createContext<TreeContextValue>({
	dispatch: () => {},
	uniqueContextId: Symbol('default'),
	getPathToItem: () => [],
	getMoveTargets: () => [],
	getChildrenOfItem: () => [],
	rootResourceId: null,
	rootResource: null,
	registerTreeItem: () => {},
	onResourceUpdate: () => Promise.resolve(),
	onResourceRemove: () => Promise.resolve(),
})

export type DependencyContext = {
	DropIndicator: React.JSX.Element
	attachInstruction: typeof attachInstruction
	extractInstruction: typeof extractInstruction
}

export const DependencyContext = createContext<DependencyContext>({
	DropIndicator: (
		<div
			style={{
				position: 'absolute',
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				pointerEvents: 'none',
			}}
			className="flex items-center justify-between px-2 text-xs"
		>
			<div className="rounded bg-blue-500/20 px-1 py-0.5 text-blue-700 dark:bg-blue-400/20 dark:text-blue-300">
				◎ Drop Target
			</div>
			{process.env.NODE_ENV === 'development' && (
				<div className="rounded bg-neutral-200/50 px-1 py-0.5 text-neutral-600 dark:bg-neutral-700/50 dark:text-neutral-300">
					{/* This will be populated by data attributes */}
					<span data-debug-drop-type></span>
				</div>
			)}
		</div>
	),
	attachInstruction: (data, options) => {
		const result = attachInstruction(data, options)
		if (process.env.NODE_ENV === 'development' && result.data) {
			// Add debug info to help visualize drop targets
			const debugEl = document.querySelector('[data-debug-drop-type]')
			if (debugEl) {
				const dropType = (result.data as { type?: string }).type
				debugEl.textContent = `Type: ${dropType || 'unknown'}`
			}
		}
		return result
	},
	extractInstruction,
})
