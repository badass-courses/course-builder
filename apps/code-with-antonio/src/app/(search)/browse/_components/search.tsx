'use client'

import { useEffect, useState } from 'react'
import {
	TYPESENSE_COLLECTION_NAME,
	typesenseInstantsearchAdapter,
} from '@/utils/typesense-instantsearch-adapter'
import { useQueryState } from 'nuqs'
import { ErrorBoundary, FallbackProps } from 'react-error-boundary'
import {
	Configure,
	useConfigure,
	useCurrentRefinements,
	useInstantSearch,
	useInstantSearchContext,
} from 'react-instantsearch'
import { InstantSearchNext } from 'react-instantsearch-nextjs'

import { InfiniteHits } from './infinite-hits'
import BrowseBy, { free } from './instantsearch/browse-by'
import { SearchBox } from './instantsearch/searchbox'

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
	const getTitleFromQuery = (query: string | null) => {
		if (query === free.join(',')) return 'Free'
		if (query === 'cohort') return 'Cohort-based'
		if (query === 'workshop') return 'Self-paced'
		return 'Newest'
	}

	const [title, setTitle] = useState('Newest')

	useEffect(() => {
		setTitle(getTitleFromQuery(type))
	}, [type, getTitleFromQuery])

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
							if (attribute === 'type') {
								// setTitle(getTitleFromQuery(refinementList.join(',')))
							}
						} else {
							setState(null)
							if (attribute === 'type') {
								// setTitle('Newest')
							}
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
			<div className="grid min-h-[calc(100svh-77px)] grid-cols-12 gap-10 py-20">
				<aside className="col-span-3">
					<BrowseBy />
					{/* <Button variant="secondary" className="hidden sm:flex" asChild>
						<Link
							href="/rss.xml"
							className="flex items-center gap-1"
							target="_blank"
						>
							<Rss className="w-3" /> RSS
						</Link>
					</Button> */}
				</aside>

				{/* <div className="grid w-full grid-cols-2 flex-row items-center gap-3 sm:grid-cols-3">
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
				</div> */}

				{/* <HitsPerPageSelect items={hitsPerPageItems} /> */}
				{/* <ClearRefinements className="mt-2 sm:mt-0" /> */}
				<div className="col-span-9">
					<h1 className="mb-5 text-2xl font-medium">{title}</h1>
					<SearchBox />
					<InfiniteHits />
				</div>
			</div>
		</InstantSearchNext>
	)
}
