import React, { createContext } from 'react'
import type { Module } from '@/lib/module'
import {
	attachInstruction,
	extractInstruction,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item'

import { Product } from '@coursebuilder/core/schemas'
import { ContentResource } from '@coursebuilder/core/types'

import type { TreeAction, TreeItem } from '../../data/tree'

export type TreeContextValue = {
	dispatch: (action: TreeAction) => void
	uniqueContextId: Symbol
	getPathToItem: (itemId: string) => string[]
	getMoveTargets: ({ itemId }: { itemId: string }) => TreeItem[]
	getChildrenOfItem: (itemId: string) => TreeItem[]
	rootResourceId: string | null
	rootResource: ContentResource | Product | Module | null
	registerTreeItem: (args: {
		itemId: string
		element: HTMLElement
		actionMenuTrigger: HTMLElement
	}) => void
}

export const TreeContext = createContext<TreeContextValue>({
	dispatch: () => {},
	uniqueContextId: Symbol('uniqueId'),
	getPathToItem: () => [],
	getMoveTargets: () => [],
	getChildrenOfItem: () => [],
	registerTreeItem: () => {},
	rootResourceId: null,
	rootResource: null,
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
