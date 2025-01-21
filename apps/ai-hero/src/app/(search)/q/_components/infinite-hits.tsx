'use client'

import Spinner from '@/components/spinner'
import type { TypesenseResource } from '@/lib/typesense'
import { useInfiniteHits, useInstantSearch } from 'react-instantsearch'
import { z } from 'zod'

import { Button } from '@coursebuilder/ui'

import Hit from './instantsearch/hit'

export function InfiniteHits() {
	const { items, showMore, isLastPage } = useInfiniteHits<TypesenseResource>({})
	const { status } = useInstantSearch()

	if (status === 'loading') {
		return (
			<div
				className="flex w-full items-center justify-center border-x border-b border-t p-5 py-8"
				aria-live="polite"
			>
				<Spinner />
				<p className="sr-only">Loading...</p>
			</div>
		)
	}

	return items.length === 0 ? (
		<div
			className="text-muted-foreground flex w-full items-center justify-center border-x border-b border-t p-5 py-8"
			aria-live="polite"
		>
			<p>No results found</p>
		</div>
	) : (
		<div>
			<ul className="divide-y border">
				{items.map((item) => (
					<Hit key={item.objectID} hit={item} />
				))}
			</ul>
			{!isLastPage && (
				<Button
					variant="ghost"
					onClick={showMore}
					disabled={isLastPage}
					className="font-semibold"
				>
					Show More
				</Button>
			)}
		</div>
	)
}
