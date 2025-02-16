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
import React, { forwardRef } from 'react'

import type { TreeItem } from './lesson-list/data/tree'

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
>(function DraggableItemRenderer({ item, label, children, className }, ref) {
	return (
		<div
			ref={ref}
			className={`flex cursor-move items-center justify-between p-2 ${className ?? ''}`}
		>
			{/* Render custom label node (or fallback to item.label) */}
			<div className="flex-1 font-semibold">
				{label ?? item.label ?? item.id}
			</div>

			{/* Render any "actions" or additional row tools */}
			{children ? (
				<div className="flex items-center gap-2">{children}</div>
			) : null}
		</div>
	)
})
