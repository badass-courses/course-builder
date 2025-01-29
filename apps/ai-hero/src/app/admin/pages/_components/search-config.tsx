import React from 'react'
import { useSelection } from '@/app/(content)/lists/[slug]/edit/_components/selection-context'
import { Configure } from 'react-instantsearch'

export default function SearchConfig() {
	const { excludedIds } = useSelection()
	return (
		<Configure
			hitsPerPage={20}
			filters={
				excludedIds.length
					? `${excludedIds.map((id) => `id:!=${id}`).join(' && ')}`
					: ''
			}
		/>
	)
}
