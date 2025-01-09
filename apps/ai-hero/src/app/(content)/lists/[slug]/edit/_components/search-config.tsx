import React from 'react'
import { Configure } from 'react-instantsearch'

import { useSelection } from './selection-context'

export default function SearchConfig() {
	const { excludedIds } = useSelection()
	return (
		<Configure
			filters={
				excludedIds.length
					? `type:post && ${excludedIds.map((id) => `id:!=${id}`).join(' && ')}`
					: 'type:post'
			}
		/>
	)
}
