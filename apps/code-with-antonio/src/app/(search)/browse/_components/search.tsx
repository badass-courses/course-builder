'use client'

import React from 'react'
import {
	TYPESENSE_COLLECTION_NAME,
	typesenseInstantsearchAdapter,
} from '@/utils/typesense-instantsearch-adapter'
import { SlidersHorizontal } from 'lucide-react'
import { useQueryState } from 'nuqs'
import { ErrorBoundary, FallbackProps } from 'react-error-boundary'
import { Configure, useInstantSearch } from 'react-instantsearch'
import { InstantSearchNext } from 'react-instantsearch-nextjs'

import {
	Button,
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '@coursebuilder/ui'

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
	const [isFilterOpen, setIsFilterOpen] = React.useState(false)

	React.useEffect(() => {
		refresh()
	}, [refresh])

	return (
		<>
			<Configure
				filters={'visibility:public && state:published'}
				hitsPerPage={40}
			/>
			<div className="flex flex-col gap-4 py-6 md:grid md:grid-cols-12 md:gap-10 md:py-10">
				{/* Desktop sidebar */}
				<aside className="hidden md:col-span-3 md:block">
					<BrowseBy />
				</aside>

				<div className="flex flex-col gap-4 md:col-span-9">
					{/* Mobile filter button + search box row */}
					<div className="flex items-center gap-3">
						<Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
							<SheetTrigger asChild>
								<Button
									variant="outline"
									size="icon"
									className="shrink-0 md:hidden"
									aria-label="Open filters"
								>
									<SlidersHorizontal className="size-4" />
								</Button>
							</SheetTrigger>
							<SheetContent side="bottom" className="max-h-[70vh]">
								<SheetHeader>
									<SheetTitle>Filters</SheetTitle>
								</SheetHeader>
								<div className="overflow-y-auto px-4 pb-6">
									<BrowseBy onSelect={() => setIsFilterOpen(false)} />
								</div>
							</SheetContent>
						</Sheet>
						<div className="flex-1">
							<SearchBox />
						</div>
					</div>
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
