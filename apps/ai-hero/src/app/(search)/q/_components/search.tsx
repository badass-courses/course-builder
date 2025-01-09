'use client'

import {
	TYPESENSE_COLLECTION_NAME,
	typesenseInstantsearchAdapter,
} from '@/utils/typesense-instantsearch-adapter'
import { useQueryState } from 'nuqs'
import { Configure } from 'react-instantsearch'
import { InstantSearchNext } from 'react-instantsearch-nextjs'

import { InfiniteHits } from './infinite-hits'
import ClearRefinements from './instantsearch/clear-refinements'
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
	const [type, setType] = useQueryState('type')
	const [instructor, setInstructor] = useQueryState('instructor')
	const [query, setQuery] = useQueryState('q')

	return (
		<InstantSearchNext
			searchClient={typesenseInstantsearchAdapter.searchClient}
			indexName={TYPESENSE_COLLECTION_NAME}
			routing={false}
			onStateChange={({ uiState, setUiState }) => {
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

				const query = uiState[TYPESENSE_COLLECTION_NAME]?.query
				setQuery(query || null)

				handleRefinementListChange('type', setType)
				// handleRefinementListChange('instructor_name', setInstructor)

				// IMPORTANT: always call setUiState to sync the state
				setUiState(uiState)
			}}
			initialUiState={
				{
					[TYPESENSE_COLLECTION_NAME]: {
						query,
						refinementList: {
							...(typeof type === 'string' && {
								type: type.split(','),
							}),
							// ...(typeof instructor === 'string' && {
							// 	instructor_name: instructor.split(','),
							// }),
						},
					},
				} as any
			}
			future={{ preserveSharedStateOnUnmount: true }}
		>
			<Configure filters={'state:published'} />
			<div className="mb-3 flex flex-row items-center gap-3">
				<SearchBox />
				{/* <RefinementList
					attribute="instructor_name"
					queryKey="instructor"
					label="Instructor"
				/> */}
				<RefinementList attribute="type" label="Type" />
				{/* <HitsPerPageSelect items={hitsPerPageItems} /> */}
				<ClearRefinements />
			</div>
			<InfiniteHits />
		</InstantSearchNext>
	)
}
