'use client'

import React from 'react'
import {
	TYPESENSE_COLLECTION_NAME,
	typesenseInstantsearchAdapter,
} from '@/utils/typesense-instantsearch-adapter'
import { useQueryState } from 'nuqs'
import { ErrorBoundary, FallbackProps } from 'react-error-boundary'
import { Configure, useInstantSearch } from 'react-instantsearch'
import { InstantSearchNext } from 'react-instantsearch-nextjs'

import { InfiniteHits } from './infinite-hits'
import BrowseBy from './instantsearch/browse-by'
import { SearchBox } from './instantsearch/searchbox'

const ErrorFallback = ({ error }: FallbackProps) => (
	<div className="rounded-lg border border-red-200 bg-red-50 p-4">
		<h3 className="font-semibold text-red-800">Search Error</h3>
		<p className="text-red-600">
			{error.message || 'An error occurred while loading search'}
		</p>
		<button
			onClick={() => window.location.reload()}
			className="mt-2 rounded bg-red-100 px-4 py-2 text-red-800 hover:bg-red-200"
		>
			Try Again
		</button>
	</div>
)

function SearchWithErrorBoundary() {
	return (
		<ErrorBoundary FallbackComponent={ErrorFallback}>
			<Search />
		</ErrorBoundary>
	)
}

export default SearchWithErrorBoundary

/**
 * Inner search content that triggers refresh on mount to handle client-side navigation
 */
function SearchContent() {
	const { refresh } = useInstantSearch()

	React.useEffect(() => {
		refresh()
	}, [refresh])

	return (
		<>
			<Configure
				filters={'visibility:public && state:published'}
				hitsPerPage={40}
			/>
			<div className="grid min-h-[calc(100svh-77px)] grid-cols-12 gap-10 py-10">
				<aside className="col-span-3">
					<BrowseBy />
				</aside>

				<div className="col-span-9 flex flex-col gap-4">
					<SearchBox />
					<InfiniteHits />
				</div>
			</div>
		</>
	)
}

/**
 * Main search component with URL state synchronization via nuqs.
 * URL params (q, type, tags) sync bidirectionally with InstantSearch state.
 */
function Search() {
	const [type, setType] = useQueryState('type')
	const [query, setQuery] = useQueryState('q')
	const [tags, setTags] = useQueryState('tags')

	// Build initial InstantSearch state from URL parameters
	const initialUiState = {
		[TYPESENSE_COLLECTION_NAME]: {
			query: query || '',
			refinementList: {
				...(type && { type: type.split(',') }),
				...(tags && { 'tags.fields.label': tags.split(',') }),
			},
		},
	}

	return (
		<InstantSearchNext
			searchClient={typesenseInstantsearchAdapter.searchClient}
			indexName={TYPESENSE_COLLECTION_NAME}
			routing={false}
			onStateChange={({ uiState, setUiState }) => {
				const indexState = uiState[TYPESENSE_COLLECTION_NAME]

				// Sync query to URL
				setQuery(indexState?.query || null)

				// Sync type refinements to URL
				const typeList = indexState?.refinementList?.type
				setType(typeList?.length ? typeList.join(',') : null)

				// Sync tags refinements to URL
				const tagsList = indexState?.refinementList?.['tags.fields.label']
				setTags(tagsList?.length ? tagsList.join(',') : null)

				setUiState(uiState)
			}}
			initialUiState={initialUiState}
			future={{
				preserveSharedStateOnUnmount: true,
			}}
		>
			<SearchContent />
		</InstantSearchNext>
	)
}
