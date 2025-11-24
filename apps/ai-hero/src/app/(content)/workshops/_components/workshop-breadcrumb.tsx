'use client'

import Link from 'next/link'
import { ArrowLeftIcon } from 'lucide-react'

import { Button } from '@coursebuilder/ui'

import { useWorkshopNavigation } from './workshop-navigation-provider'

export default function WorkshopBreadcrumb() {
	const navigation = useWorkshopNavigation()
	const cohort =
		navigation?.parents?.[0]?.type === 'cohort' && navigation?.parents?.[0]

	if (!cohort) return null

	return (
		<div className="flex items-center gap-2">
			<Link
				className="text-primary block min-w-0 max-w-[300px] flex-1 truncate sm:max-w-full"
				href={`/cohorts/${cohort.resources?.[0]?.resource.fields?.slug}`}
			>
				{cohort?.resources?.[0]?.resource.fields?.title}
			</Link>
			<span className="opacity-50">/</span>
		</div>
	)
}
