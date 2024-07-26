'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { createAppAbility, type AppAbility } from '@/ability'
import { CldImage } from '@/app/_components/cld-image'
import { Lesson } from '@/lib/lessons'
import { Module } from '@/lib/module'
import {
	NavigationLesson,
	NavigationResource,
	NavigationSection,
	WorkshopNavigation,
} from '@/lib/workshops'
import { api } from '@/trpc/react'
import { cn } from '@/utils/cn'
import { filterResources } from '@/utils/filter-resources'
import { getResourceSection } from '@/utils/get-resource-section'
import { Check, Edit, Lock } from 'lucide-react'

import type {
	ModuleProgress,
	ResourceProgress,
} from '@coursebuilder/core/schemas'
import type {
	ContentResource,
	ContentResourceResource,
} from '@coursebuilder/core/types'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
	Button,
	ScrollArea,
	Skeleton,
} from '@coursebuilder/ui'

type Props = {
	workshopNavigation: WorkshopNavigation | null
	currentLessonSlug?: string | null
	currentSectionSlug?: string | null
	className?: string
	widthFadeOut?: boolean
	wrapperClassName?: string
	maxHeight?: string
	withHeader?: boolean
}

export function WorkshopResourceList(props: Props) {
	const wrapperClassName =
		'wrapperClassName' in props ? props.wrapperClassName : ''
	const widthFadeOut = 'widthFadeOut' in props ? props.widthFadeOut : true
	const className = 'className' in props ? props.className : ''
	const withHeader = 'withHeader' in props ? props.withHeader : true
	const maxHeight =
		'maxHeight' in props ? props.maxHeight : 'h-[calc(100vh-var(--nav-height))]'

	const { data: abilityRules, status: abilityStatus } =
		api.ability.getCurrentAbilityRules.useQuery({
			moduleId: props.workshopNavigation?.id,
		})

	const ability = createAppAbility(abilityRules || [])
	const params = useParams()

	const activeResourceRef = React.useRef<HTMLLIElement>(null)
	const scrollAreaRef = React.useRef<HTMLDivElement>(null)

	React.useEffect(() => {
		// Scroll to the active resource on initial render
		if (activeResourceRef.current && scrollAreaRef.current) {
			const scrollAreaTop = scrollAreaRef.current.getBoundingClientRect().top
			const activeResourceTop =
				activeResourceRef.current.getBoundingClientRect().top
			const scrollPosition = activeResourceTop - scrollAreaTop

			scrollAreaRef.current.scrollTop = scrollPosition
		}
	}, [])

	const pathname = usePathname()

	if (!props.workshopNavigation) {
		return null
	}

	console.log(props.workshopNavigation)

	return (
		<nav
			className={cn(
				'relative w-full max-w-sm flex-shrink-0 border-r',
				className,
			)}
		>
			<div className="sticky top-0 h-auto">
				<ScrollArea className={cn(maxHeight)} viewportRef={scrollAreaRef}>
					{withHeader && (
						<div className="flex w-full flex-row items-center gap-2 p-5 pl-2">
							{props.workshopNavigation.coverImage && (
								<CldImage
									width={80}
									height={80}
									src={props.workshopNavigation.coverImage}
									alt={props.workshopNavigation.title}
								/>
							)}
							<div className="flex flex-col">
								<div className="flex items-center gap-2">
									<Link
										href="/workshops"
										className="font-heading text-primary text-base font-medium hover:underline"
									>
										Workshops
									</Link>
									<span className="opacity-50">/</span>
								</div>
								<Link
									className="font-heading fluid-lg text-balance font-bold hover:underline"
									href={`/workshops/${props.workshopNavigation.slug}`}
								>
									{props.workshopNavigation.title}
								</Link>
							</div>
						</div>
					)}
					<ol>
						<Accordion
							type="single"
							collapsible
							className={cn(
								'divide-border flex flex-col divide-y border-t pb-16',
								wrapperClassName,
							)}
							defaultValue={props.workshopNavigation.resources[0]?.id}
						>
							{props.workshopNavigation.resources.map(
								(resource: NavigationResource, i: number) => {
									return (
										<div key={resource.id}>
											{resource.title}
											{resource.type === 'section' &&
												resource.lessons.map((lesson) => (
													<div key={lesson.id}>{lesson.title}</div>
												))}
										</div>
									)
								},
							)}
						</Accordion>
					</ol>
				</ScrollArea>
				{widthFadeOut && (
					<div
						className="from-background via-background pointer-events-none absolute -bottom-10 left-0 z-50 h-32 w-full bg-gradient-to-t to-transparent"
						aria-hidden="true"
					/>
				)}
			</div>
		</nav>
	)
}

const LessonResource = ({
	lesson,
	tutorial,
	activeResourceRef,
	moduleProgress,
	index,
	ability,
	abilityStatus,
}: {
	lesson: ContentResourceResource
	tutorial: Module
	activeResourceRef: any
	moduleProgress: ModuleProgress | null
	index: number
	ability: AppAbility
	abilityStatus: 'error' | 'success' | 'pending'
}) => {
	const params = useParams()
	const pathname = usePathname()

	const isActiveSolution =
		lesson.resource.fields.slug === params.lesson &&
		pathname.endsWith('solution')
	const isActiveExercise =
		lesson.resource.fields.slug === params.lesson &&
		pathname.endsWith('exercise')
	const isActive =
		lesson.resource.fields.slug === params.lesson &&
		!isActiveSolution &&
		!isActiveExercise
	const isSubLessonListExpanded =
		isActive || isActiveExercise || isActiveSolution

	const solution: ContentResourceResource = lesson.resource.resources.find(
		(resource: ContentResourceResource) =>
			resource.resource.type === 'solution',
	)

	const isCompleted = moduleProgress?.completedLessons?.some(
		(progress) =>
			(progress.resourceId === lesson.resourceId ||
				solution?.resourceId === progress.resourceId) &&
			progress.completedAt,
	)

	return (
		<li
			key={lesson.resourceId}
			className="flex w-full flex-col"
			ref={isActive ? activeResourceRef : undefined}
		>
			<div className="flex w-full items-center">
				<Link
					className={cn(
						'hover:bg-muted relative flex w-full items-baseline py-3 pl-3 pr-6 font-medium',
						{
							'bg-muted text-primary': isActive,
							'hover:text-primary': !isActive,
						},
					)}
					href={`/workshops/${tutorial.fields?.slug}/${lesson.resource.fields.slug}`}
				>
					{isCompleted ? (
						<span aria-label="Completed" className="w-6 pr-1">
							<Check
								aria-hidden="true"
								className="text-primary relative h-4 w-4 -translate-x-1 translate-y-1"
							/>
						</span>
					) : (
						<span
							className="w-5 flex-shrink-0 pr-1 font-mono text-xs font-light text-gray-400"
							aria-hidden="true"
						>
							{index + 1}
						</span>
					)}
					<span className="w-full text-balance text-base">
						{lesson.resource.fields.title}
					</span>
				</Link>
				{abilityStatus === 'success' && (
					<>
						{ability.can('create', 'Content') ? (
							<Button
								asChild
								variant="outline"
								size="icon"
								className="scale-75"
							>
								<Link
									href={`/workshops/${tutorial?.fields?.slug}/${lesson.resource.fields.slug}/edit`}
								>
									<Edit className="w-3" />
								</Link>
							</Button>
						) : null}
						{ability.can('read', 'Content') || index === 0 ? null : (
							<Lock className="absolute right-2 w-3 text-gray-500" />
						)}
					</>
				)}
			</div>
			<div className="flex flex-col">
				{solution && isSubLessonListExpanded && (
					<>
						<Link
							href={`/workshops/${tutorial.fields?.slug}/${lesson.resource.fields.slug}`}
							className={cn(
								'hover:bg-muted relative flex w-full items-baseline px-10 py-2 font-medium before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] before:content-[""]',
								{
									'bg-muted text-primary border-primary before:bg-primary':
										isActive,
									'hover:text-primary before:bg-transparent': !isActive,
								},
							)}
						>
							Problem
						</Link>
						<Link
							href={`/workshops/${tutorial.fields?.slug}/${lesson.resource.fields.slug}/exercise`}
							className={cn(
								'hover:bg-muted relative flex w-full items-baseline px-10 py-2 font-medium before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] before:content-[""]',
								{
									'bg-muted text-primary border-primary before:bg-primary':
										isActiveExercise,
									'hover:text-primary before:bg-transparent': !isActiveExercise,
								},
							)}
						>
							Exercise
						</Link>
						<div className="flex w-full items-center">
							<Link
								href={`/workshops/${tutorial.fields?.slug}/${lesson.resource.fields.slug}/solution`}
								className={cn(
									'hover:bg-muted relative flex w-full items-baseline px-10 py-2 font-medium before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] before:content-[""]',
									{
										'bg-muted text-primary border-primary before:bg-primary':
											isActiveSolution,
										'hover:text-primary before:bg-transparent':
											!isActiveSolution,
									},
								)}
							>
								Solution
							</Link>
							{ability.can('create', 'Content') ? (
								<Button
									asChild
									variant="outline"
									size="icon"
									className="scale-75"
								>
									<Link
										href={`/workshops/${tutorial?.fields?.slug}/${solution.resource.fields.slug}/edit`}
									>
										<Edit className="w-3" />
									</Link>
								</Button>
							) : null}
						</div>
					</>
				)}
			</div>
		</li>
	)
}
