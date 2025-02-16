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
})

export type DependencyContext = {
	DropIndicator: React.JSX.Element
	attachInstruction: typeof attachInstruction
	extractInstruction: typeof extractInstruction
}

export const DependencyContext = createContext<DependencyContext>({
	DropIndicator: (
		<span
			style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
		>
			◎
		</span>
	),
	attachInstruction: attachInstruction,
	extractInstruction: extractInstruction,
})
