'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { createAppAbility, type AppAbility } from '@/ability'
import { CldImage } from '@/app/_components/cld-image'
import { Lesson } from '@/lib/lessons'
import { Module } from '@/lib/module'
import { api } from '@/trpc/react'
import { cn } from '@/utils/cn'
import { filterResources } from '@/utils/filter-resources'
import { getResourceSection } from '@/utils/get-resource-section'
import { Check, Edit, Lock } from 'lucide-react'

import type {
	ContentResource,
	ContentResourceResource,
	ModuleProgress,
	ResourceProgress,
} from '@coursebuilder/core/schemas'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
	Button,
	ScrollArea,
	Skeleton,
} from '@coursebuilder/ui'

type ContentResourceProps = {
	tutorial: Module | null
	lesson?: Lesson | null
	section?: ContentResource | null
	moduleProgress: ModuleProgress
	className?: string
	wrapperClassName?: string
	maxHeight?: string
	withHeader?: boolean
}

type ContentResourceLoaderProps = {
	tutorialLoader: Promise<Module | null>
	lessonLoader: Promise<Lesson | null>
	moduleProgressLoader: Promise<ModuleProgress>
	className?: string
	maxHeight?: string
	withHeader?: boolean
}

type Props = ContentResourceProps | ContentResourceLoaderProps

export function TutorialLessonList(props: Props) {
	const tutorial =
		'tutorial' in props
			? props.tutorial
			: 'tutorialLoader' in props
				? React.use(props.tutorialLoader)
				: null
	const lesson =
		'lesson' in props
			? props.lesson
			: 'lessonLoader' in props
				? React.use(props.lessonLoader)
				: null
	const section =
		'section' in props
			? props.section
			: lesson
				? React.use(getResourceSection(lesson.id, tutorial))
				: null
	const moduleProgress =
		'moduleProgress' in props
			? props.moduleProgress
			: 'moduleProgressLoader' in props
				? React.use(props.moduleProgressLoader)
				: null
	const wrapperClassName =
		'wrapperClassName' in props ? props.wrapperClassName : ''

	const className = 'className' in props ? props.className : ''
	const withHeader = 'withHeader' in props ? props.withHeader : true
	const maxHeight =
		'maxHeight' in props ? props.maxHeight : 'h-[calc(100vh-var(--nav-height))]'

	const { data: abilityRules, status: abilityStatus } =
		api.ability.getCurrentAbilityRules.useQuery({
			moduleId: tutorial?.id,
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

	if (!tutorial) {
		return null
	}

	const tutorialWithFilteredResources = {
		...tutorial,
		...(tutorial.resources && {
			resources: filterResources(tutorial.resources, [
				'videoResource',
				'linkResource',
			]),
		}),
	}

	return (
		<nav
			className={cn(
				'relative w-full max-w-sm flex-shrink-0 border-r',
				className,
			)}
		>
			<div className="sticky top-0 h-auto">
				{withHeader && (
					<div className="flex w-full flex-row items-center gap-2 border-b p-5 pl-2">
						{tutorial?.fields?.coverImage?.url && (
							<CldImage
								width={80}
								height={80}
								src={tutorial.fields.coverImage.url}
								alt={tutorial.fields.coverImage?.alt || tutorial.fields.title}
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
								href={`/workshops/${tutorial?.fields?.slug}`}
							>
								{tutorial?.fields?.title}
							</Link>
						</div>
					</div>
				)}
				<ScrollArea className={cn(maxHeight)} ref={scrollAreaRef}>
					<ol>
						<Accordion
							type="single"
							collapsible
							className={cn(
								'divide-border flex flex-col divide-y pb-16',
								wrapperClassName,
							)}
							defaultValue={
								section?.id || tutorial?.resources?.[0]?.resource?.id
							}
						>
							{tutorialWithFilteredResources?.resources?.map(
								(resource: ContentResourceResource, i: number) => {
									const isActiveSolution =
										resource.resource.fields.slug === params.lesson &&
										pathname.endsWith('solution')
									const isActiveExercise =
										resource.resource.fields.slug === params.lesson &&
										pathname.endsWith('exercise')
									const isActive =
										resource.resource.fields.slug === params.lesson &&
										!isActiveSolution &&
										!isActiveExercise
									const isSubLessonListExpanded =
										isActive || isActiveExercise || isActiveSolution

									const solution: ContentResourceResource =
										resource.resource.resources.find(
											(resource: ContentResourceResource) =>
												resource.resource.type === 'solution',
										)

									const isCompleted = moduleProgress?.completedLessons?.some(
										(progress) =>
											(progress.resourceId === resource.resourceId ||
												solution?.resourceId === progress.resourceId) &&
											progress.completedAt,
									)

									return resource.resource.type === 'section' ? (
										<AccordionItem
											value={resource.resourceId}
											key={resource.resourceId}
											className="border-0"
										>
											<li>
												<AccordionTrigger className="hover:bg-muted relative flex w-full items-center px-5 py-5 text-left text-lg font-semibold leading-tight">
													<h3 className="pr-2">
														{resource.resource.fields.title}
													</h3>
													{section?.id === resource.resourceId && (
														<div className="bg-primary absolute right-12 h-1 w-1 rounded-full" />
													)}
												</AccordionTrigger>
											</li>
											{resource.resource.resources.length > 0 && (
												// section lessons
												<AccordionContent>
													<ol>
														{resource.resource.resources.map(
															(lesson: ContentResourceResource, i: number) => {
																return (
																	<LessonResource
																		abilityStatus={abilityStatus}
																		ability={ability}
																		key={lesson.resource.resourceId}
																		tutorial={tutorial}
																		lesson={lesson}
																		activeResourceRef={activeResourceRef}
																		moduleProgress={moduleProgress}
																		index={i}
																	/>
																)
															},
														)}
													</ol>
												</AccordionContent>
											)}
										</AccordionItem>
									) : (
										// top-level lessons
										<LessonResource
											abilityStatus={abilityStatus}
											ability={ability}
											key={resource.resource.resourceId}
											tutorial={tutorial}
											lesson={resource.resource}
											activeResourceRef={activeResourceRef}
											moduleProgress={moduleProgress}
											index={i}
										/>
									)
								},
							)}
						</Accordion>
					</ol>
				</ScrollArea>
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
			<div className="relative flex w-full items-center">
				<Link
					className={cn(
						'hover:bg-muted relative flex w-full items-baseline py-3 pl-3 pr-10 font-medium',
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
					{abilityStatus === 'success' && (
						<>
							{ability.can('read', 'Content') || index === 0 ? null : (
								<Lock
									className="absolute right-5 w-3 text-gray-500"
									aria-label="locked"
								/>
							)}
						</>
					)}
				</Link>
				{abilityStatus === 'success' && (
					<div className="absolute right-0 flex w-10 items-center justify-center">
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
					</div>
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
