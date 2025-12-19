import React from 'react'
import { useSelection } from '@/components/list-editor/selection-context'
import { Configure } from 'react-instantsearch'

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
	return (
		<Configure
			hitsPerPage={20}
			filters={
				excludedIds.length
					? `(type:post || type:article || type:lesson || type:section || type:list || type:workshop || type:tutorial) && ${excludedIds.map((id) => `id:!=${id}`).join(' && ')}`
					: '(type:post || type:article || type:lesson || type:section || type:list || type:workshop || type:tutorial)'
			}
		/>
	)
}
