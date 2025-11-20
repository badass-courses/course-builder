'use client'

import React from 'react'
import Link from 'next/link'
import {
	TYPESENSE_COLLECTION_NAME,
	typesenseInstantsearchAdapter,
} from '@/utils/typesense-instantsearch-adapter'
import { Rss } from 'lucide-react'
import { useQueryState } from 'nuqs'
import { ErrorBoundary, FallbackProps } from 'react-error-boundary'
import { Configure, useInstantSearch } from 'react-instantsearch'
import { InstantSearchNext } from 'react-instantsearch-nextjs'

import { Button } from '@coursebuilder/ui'

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

function SearchContent() {
	const { refresh } = useInstantSearch()

	React.useEffect(() => {
		refresh()
	}, [refresh])

	return (
		<>
			<Configure
				filters={
					'visibility:public && state:published && type:!workshop && type:!lesson'
				}
				hitsPerPage={40}
			/>
			<div className="z-10 flex flex-col items-end gap-x-3 pb-4 sm:flex-row sm:items-center sm:pb-0">
				<SearchBox />
				{/* <RefinementList
					attribute="instructor_name"
					queryKey="instructor"
					label="Instructor"
				/> */}
				<div className="grid w-full grid-cols-2 flex-row items-center gap-3 sm:grid-cols-3">
					<RefinementList attribute="type" label="Type" />
					<RefinementList
						attribute="tags.fields.label"
						label="Tags"
						queryKey="tags"
					/>
					<SortBy />
					<Button variant="secondary" className="sm:hidden" asChild>
						<Link
							href="/rss.xml"
							className="flex items-center gap-1"
							target="_blank"
						>
							<Rss className="w-3" /> RSS
						</Link>
					</Button>
				</div>
				<Button variant="secondary" className="hidden sm:flex" asChild>
					<Link
						href="/rss.xml"
						className="flex items-center gap-1"
						target="_blank"
					>
						<Rss className="w-3" /> RSS
					</Link>
				</Button>
				{/* <HitsPerPageSelect items={hitsPerPageItems} /> */}
				{/* <ClearRefinements className="mt-2 sm:mt-0" /> */}
			</div>
			<InfiniteHits />
		</>
	)
}

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
			<SearchContent />
		</InstantSearchNext>
	)
}
