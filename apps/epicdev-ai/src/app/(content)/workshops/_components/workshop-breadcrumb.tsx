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
			<Button asChild variant="link" className="p-0 text-lg font-normal">
				<Link href={`/cohorts/${cohort.slug}`}>{cohort?.title}</Link>
			</Button>
			<span className="opacity-50">/</span>
		</div>
	)
}
