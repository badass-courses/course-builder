'use client'

import Link from 'next/link'
import { ArrowLeftIcon } from 'lucide-react'

import { Button } from '@coursebuilder/ui'

import { useWorkshopNavigation } from './workshop-navigation-provider'

export default function WorkshopBreadcrumb() {
	const navigation = useWorkshopNavigation()
	const cohort = navigation?.cohorts?.[0]

	if (!cohort) return null

	return (
		<div className="inline-flex items-center gap-2">
			<Link
				className="text-primary max-w-xs truncate overflow-ellipsis p-0 text-base font-normal hover:underline sm:max-w-full"
				href={`/cohorts/${cohort.slug}`}
			>
				{cohort?.title}
			</Link>

			<span className="text-violet-700 opacity-25 dark:text-violet-400">/</span>
		</div>
	)
}
