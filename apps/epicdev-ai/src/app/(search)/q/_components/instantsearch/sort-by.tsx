'use client'

import { getSearchCollectionName } from '@/lib/search-query'
import { useSortBy } from 'react-instantsearch'

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@coursebuilder/ui'

const sortOptions = [
	{
		value: getSearchCollectionName(),
		label: 'Sort by Relevance',
	},
	{
		value: `${getSearchCollectionName()}/sort/updated_at_timestamp:desc`,
		label: 'Newest First',
	},
	{
		value: `${getSearchCollectionName()}/sort/updated_at_timestamp:asc`,
		label: 'Oldest First',
	},
]

export function SortBy() {
	const { refine, currentRefinement } = useSortBy({
		items: sortOptions,
		// defaultRefinement: TYPESENSE_COLLECTION_NAME,
	})

	return (
		<Select
			value={currentRefinement}
			onValueChange={(value) => refine(value)}
			defaultValue={getSearchCollectionName()}
		>
			<SelectTrigger className="text-muted-foreground truncate text-nowrap text-base [&_span]:truncate">
				<SelectValue placeholder="Sort by..." />
			</SelectTrigger>
			<SelectContent>
				{sortOptions.map((option) => (
					<SelectItem key={option.value} value={option.value}>
						{option.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	)
}
