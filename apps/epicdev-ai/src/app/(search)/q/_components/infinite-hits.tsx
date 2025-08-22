'use client'

import Spinner from '@/components/spinner'
import type { TypesenseResource } from '@/lib/typesense'
import { useInfiniteHits, useInstantSearch } from 'react-instantsearch'
import { z } from 'zod'

import { Button } from '@coursebuilder/ui'

import Hit from './instantsearch/hit'

function SkeletonItem() {
	return (
		<div className="bg-card flex animate-pulse flex-col gap-3 rounded-lg border p-5 py-4">
			<div className="h-10 w-1/3 rounded bg-black/10 dark:bg-white/10" />
			<div className="h-3 w-full rounded bg-black/10 dark:bg-white/10" />
			<div className="h-3 w-2/3 rounded bg-black/10 dark:bg-white/10" />
			<div className="h-3 w-2/3 rounded bg-black/10 dark:bg-white/10" />
			<div className="h-3 w-2/3 rounded bg-black/10 dark:bg-white/10" />
		</div>
	)
}

export function InfiniteHits() {
	const { items, showMore, isLastPage } = useInfiniteHits<TypesenseResource>({})
	const { status } = useInstantSearch()

	if (status === 'loading') {
		return (
			<div
				className="grid h-[800px] w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
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
			className="grid h-[800px] w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
			aria-live="polite"
		>
			<div className="sr-only">Loading results...</div>
			{Array.from({ length: 5 }).map((_, i) => (
				<SkeletonItem key={i} />
			))}
		</div>
	) : (
		<div>
			<ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
