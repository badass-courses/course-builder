import React from 'react'
import { Configure } from 'react-instantsearch'

import { useSelection } from './selection-context'

/**
 * SearchConfig
 *
 * This component is used to configure the search for the list editor.
 * It filters the search results to only include posts and lessons, and excludes the excludedIds.
 *
 * TODO: consider different types and what that means in this context
 */
export default function SearchConfig() {
	const { excludedIds } = useSelection()

	// Typesense has a default limit of 100 filter operations.
	// Using array syntax `id:!=[a,b,c]` is more efficient than `id:!=a && id:!=b`.
	// Limit to 80 IDs to leave headroom for other filter operations.
	const MAX_EXCLUDED_IDS = 80
	const limitedExcludedIds = excludedIds.slice(0, MAX_EXCLUDED_IDS)

	const typeFilter =
		'(type:post || type:article || type:lesson || type:section || type:list || type:workshop || type:tutorial)'
	const excludeFilter =
		limitedExcludedIds.length > 0
			? ` && id:!=[${limitedExcludedIds.join(',')}]`
			: ''

	return (
		<Configure hitsPerPage={20} filters={`${typeFilter}${excludeFilter}`} />
	)
}
