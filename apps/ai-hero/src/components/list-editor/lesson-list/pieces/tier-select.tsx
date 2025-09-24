import React from 'react'

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@coursebuilder/ui'

import type { TreeAction, TreeItem } from '../data/tree'

/**
 * TierSelect Component
 *
 * Renders a tier selection UI, wired to dispatch the tier update action.
 *
 * @param props.item - The tree item for which to select the tier.
 * @param props.dispatch - Dispatch function for tree actions.
 *
 * @returns A React component displaying the tier select.
 */
export const TierSelect: React.FC<{
	item: TreeItem
	dispatch: React.Dispatch<TreeAction>
}> = ({ item, dispatch }) => {
	// Use the tier from item.itemData.metadata and default to 'standard'
	const tier = item.itemData?.metadata?.tier || 'standard'

	return (
		<Select
			defaultValue={tier}
			onValueChange={(value) => {
				dispatch({
					type: 'update-tier',
					itemId: item.id,
					tier: value as 'free' | 'standard' | 'premium' | 'vip',
				})
			}}
		>
			<SelectTrigger className="h-6 w-[100px]">
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="free">Free</SelectItem>
				<SelectItem value="standard">Standard</SelectItem>
				<SelectItem value="premium">Premium</SelectItem>
				<SelectItem value="vip">VIP</SelectItem>
			</SelectContent>
		</Select>
	)
}
