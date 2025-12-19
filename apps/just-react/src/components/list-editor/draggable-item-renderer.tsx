/**
 * DraggableItemRenderer
 *
 * This sexy little bastard is a pluggable component that you can feed different item data.
 * It handles rendering a draggable row, hooking into any drag & drop approach you want.
 *
 * @param {object} props
 * @param {TreeItem} props.item - The tree item or resource we're hoisting around
 * @param {React.ReactNode} [props.children] - Optional actions row for extra controls
 * @param {string} [props.className] - Additional class names
 * @param {React.Ref<HTMLDivElement>} ref - The forwarded ref for Atlassian DnD
 */
import React, { forwardRef, useContext, useState } from 'react'
import { ChevronDown, GroupIcon, X } from 'lucide-react'

import { Button, Input } from '@coursebuilder/ui'

import Spinner from '../spinner'
import type { TreeItem } from './lesson-list/data/tree'
import { TreeContext } from './lesson-list/pieces/tree/tree-context'
import type { TreeItemState } from './lesson-list/pieces/tree/tree-item'

/**
 * DraggableItemRenderer
 *
 * Wraps your item in a draggable container and displays a "label" node and optional children (like buttons or tier selectors).
 *
 * @param {TreeItem} item - The tree item data
 * @param {React.ReactNode} [label] - A custom node for the main label area
 * @param {React.ReactNode} [children] - Optional row controls or actions
 * @param {string} [className] - Additional class names
 */
interface DraggableItemRendererProps {
	item: TreeItem
	label?: React.ReactNode
	children?: React.ReactNode
	className?: string
	onClick?: (e: React.MouseEvent) => void
	onResourceUpdate?: (
		itemId: string,
		fields: Record<string, any>,
	) => Promise<void>
	state?: TreeItemState
	setState?: (state: TreeItemState) => void
}

/**
 * DraggableItemRenderer
 *
 * Wraps your item in a draggable container and optionally renders
 * any additional controls as children. The parent can pass in stuff
 * like tier selects, remove buttons, or custom icons as children.
 *
 * @param {object} props
 * @param {TreeItem} props.item - The tree item data
 * @param {React.ReactNode} [props.children] - Optional "actions row" or anything else you want
 * @param {string} [props.className] - Additional class names
 * @param {React.Ref<HTMLDivElement>} ref - The forwarded ref for Atlassian DnD
 */
export const DraggableItemRenderer = forwardRef<
	HTMLDivElement,
	DraggableItemRendererProps
>(function DraggableItemRenderer(
	{
		item,
		label,
		children,
		className,
		onClick,
		onResourceUpdate,
		state,
		setState,
	},
	ref,
) {
	const [itemLabel, setItemLabel] = useState(item.label)
	const { dispatch } = useContext(TreeContext)
	const [isSaving, setIsSaving] = useState(false)
	return (
		<div
			ref={ref}
			onClick={onClick}
			className={`flex items-center justify-between p-2 ${className ?? ''}`}
		>
			{state === 'editing' && onResourceUpdate ? (
				<div className="flex items-center gap-1 pl-7">
					<Input
						className="h-6 min-w-40"
						style={{
							width: `${item.label?.length}ch`,
						}}
						type="text"
						defaultValue={itemLabel}
						onChange={(e) => {
							setItemLabel(e.target.value)
						}}
					/>
					<Button
						type="button"
						variant="default"
						className="h-5 px-2 disabled:cursor-wait"
						onClick={async (e) => {
							if (!itemLabel) return

							try {
								setIsSaving(true)
								await onResourceUpdate?.(item.id, { title: itemLabel })
								dispatch({
									type: 'update-item',
									itemId: item.id,
									fields: { title: itemLabel },
								})
								setState?.('idle')
							} catch (error) {
								console.error('Failed to update section name:', error)
								// Could add toast notification here
							} finally {
								setIsSaving(false)
							}
						}}
					>
						{isSaving ? <Spinner className="h-3 w-3" /> : 'Save'}
					</Button>
					<Button
						type="button"
						variant="ghost"
						className="h-6 px-1"
						onClick={() => {
							setState?.('idle')
						}}
					>
						<X className="h-4 w-4" />
					</Button>
				</div>
			) : (
				<div className="flex-1 font-semibold">
					{label ?? item.label ?? item.id}
				</div>
			)}
			{/* Render any "actions" or additional row tools */}
			{children ? (
				<div className="flex items-center gap-2">{children}</div>
			) : null}
		</div>
	)
})
