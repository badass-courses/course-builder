'use client'

import { useQueryState } from 'nuqs'
import { useRefinementList } from 'react-instantsearch'

import { Separator } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

const FREE_TYPES = ['tutorial', 'post', 'list', 'article']

/**
 * BrowseBy navigation component for filtering content by type.
 * Provides preset filters for content categories: Newest, Cohort-based, Self-paced, and Free.
 */
export default function BrowseBy() {
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
	}

	return (
		<ul className="flex flex-col gap-5">
			<li>
				<p className="pb-5">Browse by</p>
				<Separator />
			</li>
			<li>
				<button
					className={cn({
						'text-primary': isNewestActive,
					})}
					onClick={handleNewestClick}
				>
					Newest
				</button>
			</li>
			<li>
				<button
					className={cn({
						'text-primary': isCohortActive,
					})}
					onClick={handleCohortClick}
				>
					Cohort-based
				</button>
			</li>
			<li>
				<button
					className={cn({
						'text-primary': isWorkshopActive,
					})}
					onClick={handleWorkshopClick}
				>
					Self-paced
				</button>
			</li>
			<li>
				<button
					className={cn({
						'text-primary': isFreeActive,
					})}
					onClick={handleFreeClick}
				>
					Free
				</button>
			</li>
		</ul>
	)
}
