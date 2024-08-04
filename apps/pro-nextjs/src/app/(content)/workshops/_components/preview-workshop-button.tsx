'use client'

import * as React from 'react'
import Link from 'next/link'
import { useWorkshopNavigation } from '@/app/(content)/workshops/_components/workshop-navigation-provider'
import { getFirstLessonSlug } from '@/lib/workshops'

import { Button } from '@coursebuilder/ui'

export function PreviewWorkshopButton({ moduleSlug }: { moduleSlug: string }) {
	const workshopNavigation = useWorkshopNavigation()
	const firstLessonSlug = getFirstLessonSlug(workshopNavigation)
	return (
		<Button
			asChild
			variant="outline"
			size="lg"
			className="mt-10 w-full min-w-48 md:w-auto"
		>
			<Link href={`/workshops/${moduleSlug}/${firstLessonSlug}`}>
				Preview Workshop
			</Link>
		</Button>
	)
}
