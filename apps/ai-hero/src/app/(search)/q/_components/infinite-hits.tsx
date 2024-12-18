'use client'

import type { TypesenseResource } from '@/lib/typesense'
import { useInfiniteHits } from 'react-instantsearch'
import { z } from 'zod'

import { Button } from '@coursebuilder/ui'

import Hit from './instantsearch/hit'

export function InfiniteHits() {
	const { items, showMore, isLastPage } = useInfiniteHits<TypesenseResource>({})

	return items.length === 0 ? (
		<div>
			<p>No results found</p>
		</div>
	) : (
		<div>
			<ul className="divide-y">
				{items.map((item) => (
					<Hit key={item.objectID} hit={item} />
				))}
			</ul>
			<Button
				variant="ghost"
				onClick={showMore}
				disabled={isLastPage}
				className="font-semibold"
			>
				Show More
			</Button>
		</div>
	)
}
