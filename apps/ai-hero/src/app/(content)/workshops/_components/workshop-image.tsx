'use client'

import { use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getFirstLessonSlug } from '@/lib/workshops'
import { PlayIcon } from '@heroicons/react/24/solid'

import type { AbilityForResource } from '@coursebuilder/utils-auth/current-ability-rules'

import { useModuleProgress } from '../../_components/module-progress-provider'
import { useWorkshopNavigation } from './workshop-navigation-provider'

export default function WorkshopImage({
	imageUrl,
	abilityLoader,
}: {
	imageUrl: string
	abilityLoader: Promise<
		Omit<AbilityForResource, 'canView'> & {
			canViewWorkshop: boolean
			canViewLesson: boolean
			isPendingOpenAccess: boolean
		}
	>
}) {
	const workshopNavigation = useWorkshopNavigation()
	const firstLessonSlug = getFirstLessonSlug(workshopNavigation)
	const { moduleProgress } = useModuleProgress()
	const isWorkshopInProgress =
		moduleProgress?.nextResource?.fields?.slug &&
		moduleProgress?.completedLessons?.length > 0
	const ability = use(abilityLoader)
	const canView = ability?.canViewWorkshop
	const url = isWorkshopInProgress
		? `/workshops/${workshopNavigation?.slug}/${moduleProgress?.nextResource?.fields?.slug}`
		: `/workshops/${workshopNavigation?.slug}/${firstLessonSlug}`
	const Comp = ({ children }: { children: React.ReactNode }) =>
		canView ? (
			<Link
				className="group relative flex items-center justify-center"
				href={url}
			>
				{children}
			</Link>
		) : (
			<div className="group relative flex items-center justify-center">
				{children}
			</div>
		)

	return (
		<Comp>
			<Image
				priority
				alt={workshopNavigation?.title || ''}
				src={imageUrl}
				width={480}
				height={270}
				className="brightness-100 transition duration-300 ease-in-out group-hover:brightness-100 sm:rounded"
				sizes="(max-width: 768px) 100vw, 480px"
			/>
			{canView && (
				<div className="bg-background/80 absolute bottom-5 right-5 flex items-center justify-center rounded-full p-2 backdrop-blur-md transition ease-out group-hover:scale-110">
					<PlayIcon className="relative h-5 w-5 translate-x-px" />
					<span className="sr-only">Start Learning</span>
				</div>
			)}
		</Comp>
	)
}
