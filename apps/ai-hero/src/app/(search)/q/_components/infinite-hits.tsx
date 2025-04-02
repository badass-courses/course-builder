'use client'

import Spinner from '@/components/spinner'
import type { TypesenseResource } from '@/lib/typesense'
import { useInfiniteHits, useInstantSearch } from 'react-instantsearch'
import { z } from 'zod'

import { Button } from '@coursebuilder/ui'

import Hit from './instantsearch/hit'

function SkeletonItem() {
	return (
		<div className="flex animate-pulse gap-4 p-4">
			<div className="h-16 w-16 flex-shrink-0 rounded-md bg-black/10 dark:bg-white/10" />
			<div className="flex-1 space-y-3">
				<div className="h-4 w-1/3 rounded bg-black/10 dark:bg-white/10" />
				<div className="h-3 w-full rounded bg-black/10 dark:bg-white/10" />
				<div className="h-3 w-2/3 rounded bg-black/10 dark:bg-white/10" />
			</div>
		</div>
	)
}

export function InfiniteHits() {
	const { items, showMore, isLastPage } = useInfiniteHits<TypesenseResource>({})
	const { status } = useInstantSearch()

	if (status === 'loading') {
		return (
			<div
				className="h-[800px] w-full border-x border-b border-t"
				aria-live="polite"
			>
				<div className="sr-only">Loading results...</div>
				{Array.from({ length: 5 }).map((_, i) => (
					<SkeletonItem key={i} />
				))}
			</div>
		)
	}

	return items.length === 0 && status !== 'idle' ? (
		<div
			className="h-[800px] w-full border-x border-b border-t"
			aria-live="polite"
		>
			<div className="sr-only">Loading results...</div>
			{Array.from({ length: 5 }).map((_, i) => (
				<SkeletonItem key={i} />
			))}
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
