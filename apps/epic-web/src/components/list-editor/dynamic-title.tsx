import React from 'react'

import { useSelection } from './selection-context'

export function DynamicTitle() {
	const { excludedIds } = useSelection()
	return (
		<span className="flex text-lg font-bold">
			{excludedIds.length > 0 ? 'In the list' : 'Start by adding resources.'}
		</span>
	)
}
