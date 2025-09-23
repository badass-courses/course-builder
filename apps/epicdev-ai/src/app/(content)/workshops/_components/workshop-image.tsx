'use client'

import Image from 'next/image'
import Link from 'next/link'
import { getFirstLessonSlug } from '@/lib/workshops'
import { PlayIcon } from '@heroicons/react/24/solid'

import { useModuleProgress } from '../../_components/module-progress-provider'
import { useWorkshopNavigation } from './workshop-navigation-provider'

export default function WorkshopImage({ imageUrl }: { imageUrl: string }) {
	const workshopNavigation = useWorkshopNavigation()
	const firstLessonSlug = getFirstLessonSlug(workshopNavigation)
	const { moduleProgress } = useModuleProgress()
	const isWorkshopInProgress =
		moduleProgress?.nextResource?.fields?.slug &&
		moduleProgress?.completedLessons?.length > 0

	const url = isWorkshopInProgress
		? `/workshops/${workshopNavigation?.slug}/${moduleProgress?.nextResource?.fields?.slug}`
		: `/workshops/${workshopNavigation?.slug}/${firstLessonSlug}`

	return (
		<Link
			className="group relative flex items-center justify-center"
			href={url}
		>
			<Image
				priority
				alt={workshopNavigation?.title || ''}
				src={imageUrl}
				width={480}
				height={270}
				className="ring-gray-800/7.5 rounded-lg shadow-[0px_4px_38px_-14px_rgba(0,_0,_0,_0.2)] ring-1 brightness-100 transition duration-300 ease-in-out group-hover:brightness-105 dark:brightness-90"
				sizes="(max-width: 768px) 100vw, 480px"
			/>
			<div className="bg-background/80 absolute bottom-5 left-5 flex items-center justify-center rounded-full p-2 backdrop-blur-md transition ease-out group-hover:scale-110">
				<PlayIcon className="relative h-5 w-5 translate-x-px" />
				<span className="sr-only">Start Learning</span>
			</div>
		</Link>
	)
}
