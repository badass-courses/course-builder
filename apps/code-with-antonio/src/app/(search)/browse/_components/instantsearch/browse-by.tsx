'use client'

import { useState } from 'react'
import { useQueryState } from 'nuqs'
import {
	useClearRefinements,
	useConfigure,
	useRefinementList,
} from 'react-instantsearch'

import { Separator } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

export const free = ['tutorial', 'article', 'nextUp', 'post']

export default function BrowseBy() {
	const { refine: clear } = useClearRefinements({})
	const { refine } = useRefinementList({
		attribute: 'type',
		operator: 'or',
	})
	const [queryParam] = useQueryState<string[]>('type', {
		defaultValue: [],
		parse: (value) => value.split(','),
	})

	const [values, setValues] = useState<string[]>(queryParam)

	return (
		<ul className="flex flex-col gap-5">
			<li>
				<p className="pb-5">Browse by</p>
				<Separator />
			</li>
			<li>
				<button
					className={cn({
						'text-primary': values.includes('newest') || values.length === 0,
					})}
					onClick={() => {
						clear()
						setValues(['newest'])
					}}
				>
					Newest
				</button>
			</li>
			<li>
				<button
					className={cn(
						{},
						{
							'text-primary': values.includes('cohort'),
						},
					)}
					onClick={() => {
						clear()
						refine('cohort')
						setValues(['cohort'])
					}}
				>
					Cohort-based
				</button>
			</li>
			<li>
				<button
					className={cn({
						'text-primary': values.includes('workshop'),
					})}
					onClick={() => {
						clear()
						refine('workshop')
						setValues(['workshop'])
					}}
				>
					Self-paced
				</button>
			</li>
			<li>
				<button
					className={cn({
						'text-primary':
							values.includes('tutorial') ||
							values.includes('article') ||
							values.includes('nextUp') ||
							values.includes('post'),
					})}
					onClick={() => {
						clear()
						refine('tutorial')
						refine('article')
						refine('nextUp')
						refine('post')
						setValues(['tutorial', 'article', 'nextUp', 'post'])
					}}
				>
					Free
				</button>
			</li>
		</ul>
	)
}
