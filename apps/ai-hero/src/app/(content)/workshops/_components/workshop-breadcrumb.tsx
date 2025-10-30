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
		<div className="inline-flex items-center gap-2">
			<Link href={`/cohorts/${cohort.fields?.slug}`}>
				<Button variant="link" className="p-0 text-lg font-normal">
					{cohort?.fields?.title}
				</Button>
			</Link>
			<span className="opacity-50">/</span>
		</div>
	)
}
