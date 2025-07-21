'use client'

import { useEffect, useState } from 'react'
import Spinner from '@/components/spinner'
import { useInfiniteHits, useInstantSearch } from 'react-instantsearch'

import type { SearchableResource } from '@coursebuilder/core/providers/search/schemas'
import { Button } from '@coursebuilder/ui'

import Hit from './instantsearch/hit'

function SkeletonItem() {
	return (
		<div className="flex animate-pulse gap-4 py-4">
			<div className="h-16 w-16 flex-shrink-0 rounded-md bg-black/10 dark:bg-white/10" />
			<div className="flex-1 space-y-3">
				<div className="h-8 w-1/3 rounded bg-black/10 dark:bg-white/10" />
				<div className="h-3 w-full rounded bg-black/10 dark:bg-white/10" />
				<div className="h-3 w-2/3 rounded bg-black/10 dark:bg-white/10" />
			</div>
		</div>
	)
}

export function InfiniteHits() {
	const [isMounted, setIsMounted] = useState(false)
	const { items, showMore, isLastPage } = useInfiniteHits<SearchableResource>(
		{},
	)
	const { status } = useInstantSearch()

	useEffect(() => {
		setIsMounted(true)
	}, [])

	// Show consistent loading state during SSR and initial hydration
	if (!isMounted || status === 'loading') {
		return (
			<div className="h-[800px] w-full" aria-live="polite">
				<div className="sr-only">Loading results...</div>
				{Array.from({ length: 5 }).map((_, i) => (
					<SkeletonItem key={i} />
				))}
			</div>
		)
	}

	// Show skeleton if no items and still searching
	if (items.length === 0 && status !== 'idle') {
		return (
			<div className="h-[800px] w-full" aria-live="polite">
				<div className="sr-only">Loading results...</div>
				{Array.from({ length: 5 }).map((_, i) => (
					<SkeletonItem key={i} />
				))}
			</div>
		)
	}

	// Show results or empty state
	return (
		<div>
			<ul className="">
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
