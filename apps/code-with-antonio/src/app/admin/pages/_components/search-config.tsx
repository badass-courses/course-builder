import React from 'react'
import { useSelection } from '@/components/list-editor/selection-context'
import { Configure } from 'react-instantsearch'

export default function SearchConfig() {
	const { excludedIds } = useSelection()
	// Typesense has a default limit of 100 filter operations.
	// Limit to 80 IDs to leave headroom for other filter operations.
	const MAX_EXCLUDED_IDS = 80
	const limitedExcludedIds = excludedIds.slice(0, MAX_EXCLUDED_IDS)
	const excludeFilter =
		limitedExcludedIds.length > 0
			? `id:!=[${limitedExcludedIds.join(',')}]`
			: ''
	return <Configure hitsPerPage={20} filters={excludeFilter} />
}
