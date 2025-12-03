'use client'

import { useEffect } from 'react'
import Spinner from '@/components/spinner'
import type { TypesenseResource } from '@/lib/typesense'
import { SearchIcon } from 'lucide-react'
import {
	useConfigure,
	useInfiniteHits,
	useInstantSearch,
} from 'react-instantsearch'
import { z } from 'zod'

import { Button } from '@coursebuilder/ui'

import Hit from './instantsearch/hit'

function SkeletonItem() {
	return (
		<div className="flex animate-pulse flex-col gap-4">
			<div className="aspect-video w-full shrink-0 rounded-md bg-black/10 dark:bg-white/10" />
			{/* <div className="flex-1 space-y-3">
				<div className="h-4 w-1/3 rounded bg-black/10 dark:bg-white/10" />
				<div className="h-3 w-full rounded bg-black/10 dark:bg-white/10" />
				<div className="h-3 w-2/3 rounded bg-black/10 dark:bg-white/10" />
			</div> */}
		</div>
	)
}

export function InfiniteHits() {
	const { items, showMore, isLastPage } = useInfiniteHits<TypesenseResource>()
	const { status } = useInstantSearch()

	// Show skeleton during initial load or when search is stalled (refinements being applied)
	if (status === 'loading' || status === 'stalled') {
		return (
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2" aria-live="polite">
				<div className="sr-only">Loading results...</div>
				{Array.from({ length: 5 }).map((_, i) => (
					<SkeletonItem key={i} />
				))}
			</div>
		)
	}

	return items.length === 0 && status !== 'idle' ? (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2" aria-live="polite">
			<div className="sr-only">Loading results...</div>
			{Array.from({ length: 5 }).map((_, i) => (
				<SkeletonItem key={i} />
			))}
		</div>
	) : (
		<div>
			{items.length === 0 && (
				<div className="flex items-center justify-center gap-2 p-10 text-center">
					<SearchIcon className="text-muted-foreground size-5" />
					<span className="text-muted-foreground">No results found</span>
				</div>
			)}
			<ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
