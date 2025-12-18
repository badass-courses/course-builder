'use client'

import { useQueryState } from 'nuqs'
import { useRefinementList } from 'react-instantsearch'

import { Button, Separator } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

const FREE_TYPES = ['tutorial', 'post', 'list', 'article']

interface BrowseByProps {
	/** Optional callback fired when a filter is selected (useful for closing mobile sheets) */
	onSelect?: () => void
}

/**
 * BrowseBy navigation component for filtering content by type.
 * Provides preset filters for content categories: Newest, Cohort-based, Self-paced, and Free.
 */
export default function BrowseBy({ onSelect }: BrowseByProps) {
	const { items, refine } = useRefinementList({
		attribute: 'type',
		operator: 'or',
	})

	// Read URL to determine initial active state (before InstantSearch is ready)
	const [typeParam] = useQueryState('type')

	// Get currently selected type values from InstantSearch (once it's initialized)
	const selectedTypes = items
		.filter((item) => item.isRefined)
		.map((item) => item.value)

	// If InstantSearch hasn't initialized yet, use URL params
	const activeTypes =
		selectedTypes.length > 0
			? selectedTypes
			: typeParam
				? typeParam.split(',')
				: []

	// Check if specific types are active (use activeTypes for initial render support)
	const isNewestActive = activeTypes.length === 0
	const isCohortActive =
		activeTypes.length === 1 && activeTypes.includes('cohort')
	const isWorkshopActive =
		activeTypes.length === 1 && activeTypes.includes('workshop')
	const isFreeActive =
		activeTypes.length === FREE_TYPES.length &&
		FREE_TYPES.every((type) => activeTypes.includes(type))

	const handleNewestClick = () => {
		// Unrefine all currently refined items
		items.forEach((item) => {
			if (item.isRefined) {
				refine(item.value)
			}
		})
		onSelect?.()
	}

	const handleCohortClick = () => {
		// Unrefine all currently refined items
		items.forEach((item) => {
			if (item.isRefined) {
				refine(item.value)
			}
		})
		// Then refine cohort
		refine('cohort')
		onSelect?.()
	}

	const handleWorkshopClick = () => {
		// Unrefine all currently refined items
		items.forEach((item) => {
			if (item.isRefined) {
				refine(item.value)
			}
		})
		// Then refine workshop
		refine('workshop')
		onSelect?.()
	}

	const handleFreeClick = () => {
		// Unrefine all currently refined items
		items.forEach((item) => {
			if (item.isRefined) {
				refine(item.value)
			}
		})
		// Then refine all free types
		FREE_TYPES.forEach((type) => refine(type))
		onSelect?.()
	}

	return (
		<div className="flex flex-col gap-5">
			<div>
				<p className="px-8 font-medium">Browse by</p>
				{/* <Separator /> */}
			</div>
			<ul className="mt-2 flex flex-col gap-3 px-5">
				<li>
					<Button
						className={cn('cursor-pointer rounded-full', {
							'text-primary': isNewestActive,
						})}
						variant={isNewestActive ? 'outline' : 'ghost'}
						onClick={handleNewestClick}
						aria-pressed={isNewestActive}
					>
						Newest
					</Button>
				</li>
				<li>
					<Button
						className={cn('cursor-pointer rounded-full', {
							'text-primary': isCohortActive,
						})}
						variant={isCohortActive ? 'outline' : 'ghost'}
						onClick={handleCohortClick}
						aria-pressed={isCohortActive}
					>
						Cohort-based
					</Button>
				</li>
				<li>
					<Button
						className={cn('cursor-pointer rounded-full', {
							'text-primary': isWorkshopActive,
						})}
						variant={isWorkshopActive ? 'outline' : 'ghost'}
						onClick={handleWorkshopClick}
						aria-pressed={isWorkshopActive}
					>
						Self-paced
					</Button>
				</li>
				<li>
					<Button
						className={cn('cursor-pointer rounded-full', {
							'text-primary': isFreeActive,
						})}
						variant={isFreeActive ? 'outline' : 'ghost'}
						onClick={handleFreeClick}
						aria-pressed={isFreeActive}
					>
						Free
					</Button>
				</li>
			</ul>
		</div>
	)
}
