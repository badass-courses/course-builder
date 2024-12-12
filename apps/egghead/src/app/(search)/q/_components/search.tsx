'use client'

import {
	TYPESENSE_COLLECTION_NAME,
	typesenseInstantsearchAdapter,
} from '@/utils/typesense-instantsearch-adapter'
import { InstantSearchNext } from 'react-instantsearch-nextjs'

import { InfiniteHits } from './infinite-hits'
import ClearRefinements from './instantsearch/clear-refinements'
import { CurrentRefinements } from './instantsearch/current-refinements'
import { HitsPerPageSelect } from './instantsearch/hits-per-page-select'
import { RefinementList } from './instantsearch/refinement-list'
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

export default function Search() {
	return (
		<InstantSearchNext
			searchClient={typesenseInstantsearchAdapter.searchClient}
			indexName={TYPESENSE_COLLECTION_NAME}
			// onStateChange={(state) => {}}
			// TODO: implement unique instructor params per https://github.com/skillrecordings/egghead-next/blob/main/src/pages/q/%5B%5B...all%5D%5D.tsx#L96
			routing={{
				// router: history(),
				stateMapping: {
					stateToRoute(uiState) {
						// uiState looks like { [TYPESENSE_COLLECTION_NAME]: { query: '...', ... } }
						return uiState[TYPESENSE_COLLECTION_NAME] || {}
					},
					routeToState(routeState) {
						// reintroduce the index name when going from route to state
						return {
							[TYPESENSE_COLLECTION_NAME]: routeState,
						}
					},
				},
			}}
			future={{ preserveSharedStateOnUnmount: true }}
		>
			{/* <CurrentRefinements /> */}
			<SearchBox />
			<div className="mb-3 flex flex-wrap items-center gap-3">
				<RefinementList attribute="instructor_name" label="Instructor" />
				<RefinementList attribute="type" label="Type" />
				<HitsPerPageSelect items={hitsPerPageItems} />
				<ClearRefinements />
			</div>
			<InfiniteHits />
		</InstantSearchNext>
	)
}
