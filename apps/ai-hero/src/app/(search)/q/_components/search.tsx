'use client'

import React from 'react'
import {
	TYPESENSE_COLLECTION_NAME,
	typesenseInstantsearchAdapter,
} from '@/utils/typesense-instantsearch-adapter'
import { useQueryState } from 'nuqs'
import { ErrorBoundary, FallbackProps } from 'react-error-boundary'
import { Configure } from 'react-instantsearch'
import { InstantSearchNext } from 'react-instantsearch-nextjs'

import { InfiniteHits } from './infinite-hits'
import ClearRefinements from './instantsearch/clear-refinements'
import { RefinementList } from './instantsearch/refinement-list'
import { SearchBox } from './instantsearch/searchbox'
import { SortBy } from './instantsearch/sort-by'

const hitsPerPageItems = [
	{
		label: '15 per page',
		value: 15,
		default: true,
	},
	{
		label: '30 per page',
		value: 30,
	},
]

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

function Search() {
	const [type, setType] = useQueryState('type')
	const [instructor, setInstructor] = useQueryState('instructor')
	const [query, setQuery] = useQueryState('q')
	const [tagsValue, setTagsValue] = useQueryState('tags')

	const initialUiState = {
		[TYPESENSE_COLLECTION_NAME]: {
			query: query || '',
			refinementList: {
				...(typeof type === 'string' && {
					type: type.split(','),
				}),
				...(typeof tagsValue === 'string' && {
					'tags.fields.label': tagsValue.split(','),
				}),
			},
		},
	}

	return (
		<InstantSearchNext
			searchClient={typesenseInstantsearchAdapter.searchClient}
			indexName={TYPESENSE_COLLECTION_NAME}
			routing={false}
			onStateChange={({ uiState, setUiState }) => {
				try {
					function handleRefinementListChange(
						attribute: string,
						setState: (value: any) => void,
					) {
						const refinementList =
							uiState[TYPESENSE_COLLECTION_NAME]?.refinementList?.[attribute]
						if (refinementList && refinementList.length > 0) {
							setState(refinementList)
						} else {
							setState(null)
						}
					}

					const searchQuery = uiState[TYPESENSE_COLLECTION_NAME]?.query
					setQuery(searchQuery || null)

					handleRefinementListChange('type', setType)
					handleRefinementListChange('tags.fields.label', setTagsValue)

					setUiState(uiState)
				} catch (error) {
					console.error('Search state update error:', error)
				}
			}}
			initialUiState={initialUiState}
			future={{ preserveSharedStateOnUnmount: true }}
		>
			<Configure
				filters={'visibility:public && state:published'}
				hitsPerPage={40}
			/>
			<div className="bg-background top-[var(--nav-height)] z-10 flex flex-col items-end gap-x-3 border-x border-b border-t px-4 pb-4 sm:sticky sm:flex-row sm:items-center sm:border-t-0 sm:pb-0">
				<SearchBox />
				{/* <RefinementList
					attribute="instructor_name"
					queryKey="instructor"
					label="Instructor"
				/> */}
				<div className="grid w-full grid-cols-3 flex-row items-center gap-3">
					<RefinementList attribute="type" label="Type" />
					<RefinementList
						attribute="tags.fields.label"
						label="Tags"
						queryKey="tags"
					/>
					<SortBy />
				</div>
				{/* <HitsPerPageSelect items={hitsPerPageItems} /> */}
				{/* <ClearRefinements className="mt-2 sm:mt-0" /> */}
			</div>
			<InfiniteHits />
		</InstantSearchNext>
	)
}
