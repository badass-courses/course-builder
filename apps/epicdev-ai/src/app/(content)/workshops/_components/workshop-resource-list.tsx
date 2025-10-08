'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { createAppAbility, type AppAbility } from '@/ability'
import { useModuleProgress } from '@/app/(content)/_components/module-progress-provider'
import { useWorkshopNavigation } from '@/app/(content)/workshops/_components/workshop-navigation-provider'
import { CldImage } from '@/components/cld-image'
import { findSectionIdForLessonSlug, NavigationResource } from '@/lib/workshops'
import { api } from '@/trpc/react'
import { cn } from '@/utils/cn'
import { subject } from '@casl/ability'
import { Check, Lock, PanelLeftClose, PanelLeftOpen, Pen } from 'lucide-react'
import { useMeasure } from 'react-use'

import type { ModuleProgress } from '@coursebuilder/core/schemas'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
	Button,
	ScrollArea,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@coursebuilder/ui'

import { AutoPlayToggle } from '../../_components/autoplay-toggle'

type Props = {
	currentLessonSlug?: string
	currentSectionSlug?: string | null
	className?: string
	wrapperClassName?: string
	maxHeight?: string
	withHeader?: boolean
	isCollapsible?: boolean
}

export function WorkshopResourceList(props: Props) {
	const wrapperClassName =
		'wrapperClassName' in props ? props.wrapperClassName : ''
	const className = 'className' in props ? props.className : ''
	const withHeader = 'withHeader' in props ? props.withHeader : true
	const maxHeight =
		'maxHeight' in props
			? props.maxHeight
			: 'max-h-[calc(100vh-var(--nav-height))]'
	const isCollapsible = 'isCollapsible' in props ? props.isCollapsible : true

	const workshopNavigation = useWorkshopNavigation()
	const { moduleProgress } = useModuleProgress()

	const { data: abilityRules, status: abilityStatus } =
		api.ability.getCurrentAbilityRules.useQuery(
			{
				moduleId: workshopNavigation?.id,
				// lessonId: props.currentLessonSlug,
			},
			{
				enabled: !!workshopNavigation?.id,
			},
		)

	const ability = createAppAbility(abilityRules || [])

	const sectionId = findSectionIdForLessonSlug(
		workshopNavigation,
		props.currentLessonSlug,
	)

	const scrollAreaRef = React.useRef<HTMLDivElement>(null)

	React.useEffect(() => {
		// scroll to active resource on mount
		const resourceToScrollToRef = document.querySelector(
			'li[data-active="true"]',
		)
		const scrollArea = scrollAreaRef.current
		if (resourceToScrollToRef && scrollArea) {
			const scrollAreaTop = scrollArea.getBoundingClientRect().top
			const activeResourceTop =
				resourceToScrollToRef.getBoundingClientRect().top
			const scrollPosition = activeResourceTop - scrollAreaTop

			scrollArea.scrollTop += scrollPosition
		}
	}, [scrollAreaRef])

	const [ref, { height: headerHeight }] = useMeasure()

	if (!workshopNavigation) {
		return null
	}

	const { resources, setIsSidebarCollapsed, isSidebarCollapsed } =
		workshopNavigation

	const cohort = workshopNavigation.cohorts?.[0]

	return (
		<nav
			onClick={() => {
				if (isCollapsible && isSidebarCollapsed) {
					setIsSidebarCollapsed(!isSidebarCollapsed)
				}
			}}
			aria-expanded={!isSidebarCollapsed}
			aria-controls="workshop-navigation"
			aria-label="Workshop navigation"
			className={cn('relative w-full max-w-xs shrink-0 text-sm', className, {
				'': !isSidebarCollapsed,
				'w-8 cursor-pointer transition [&_div]:hidden':
					isSidebarCollapsed && isCollapsible,
				'pb-5': isCollapsible,
				// 'bg-card overflow-hidden rounded-t-lg border-x border-t shadow-[0px_4px_38px_-14px_rgba(0,_0,_0,_0.1)]':
				// 	isCollapsible,
			})}
		>
			<TooltipProvider>
				{isSidebarCollapsed && isCollapsible && (
					<span className="sticky top-0 flex items-center justify-center border-b p-2">
						<Tooltip key={`${isSidebarCollapsed}-${isCollapsible}`}>
							<TooltipTrigger asChild>
								<PanelLeftOpen className="size-4" />
							</TooltipTrigger>
							<TooltipContent side="left">Open navigation</TooltipContent>
						</Tooltip>
					</span>
				)}
				<div
					className={cn('sticky top-3 overflow-hidden', maxHeight, {
						'bg-card rounded-lg border shadow-[0px_4px_38px_-14px_rgba(0,_0,_0,_0.1)]':
							isCollapsible,
					})}
				>
					{withHeader && (
						<div
							ref={ref as any}
							className={cn(
								'dark:border-foreground/5 border-border relative z-10 w-full border-b pl-2',
							)}
						>
							{isCollapsible && (
								<Tooltip delayDuration={0}>
									<TooltipTrigger asChild>
										<Button
											className={cn(
												'bg-background text-foreground hover:bg-background absolute right-1.5 top-1.5 z-50 hidden h-8 w-8 border p-1 transition lg:flex',
												{
													'right-0.5': isSidebarCollapsed,
												},
											)}
											size="icon"
											type="button"
											onClick={() => {
												setIsSidebarCollapsed(!isSidebarCollapsed)
											}}
										>
											{isSidebarCollapsed ? (
												<PanelLeftOpen className="h-4 w-4" />
											) : (
												<PanelLeftClose className="h-4 w-4" />
											)}
										</Button>
									</TooltipTrigger>
									<TooltipContent className="z-1000" side="left">
										{isSidebarCollapsed ? 'Open sidebar' : 'Collapse sidebar'}
									</TooltipContent>
								</Tooltip>
							)}
							<div className="relative z-10 flex w-full flex-row items-center gap-3 px-3 py-4">
								{/* {workshopNavigation.coverImage && (
									<CldImage
										width={48}
										height={48}
										src={workshopNavigation.coverImage}
										alt={workshopNavigation.title}
									/>
								)} */}
								<div className="flex flex-col leading-tight">
									<div className="flex items-center gap-0.5">
										<Link
											href={cohort ? `/cohorts/${cohort.slug}` : '/workshops'}
											className="max-w-[260px] truncate overflow-ellipsis text-sm font-normal hover:underline"
										>
											{cohort ? cohort.title : 'Workshops'}
										</Link>
										<span className="px-1 font-mono opacity-50">/</span>
									</div>
									<Link
										className="font-heading mt-1 text-balance text-lg font-semibold leading-tight tracking-tight hover:underline xl:text-xl xl:leading-tight"
										href={`/workshops/${workshopNavigation.slug}`}
									>
										{workshopNavigation.title}
									</Link>
									<AutoPlayToggle className="text-muted-foreground hover:[&_label]:text-foreground relative z-10 -ml-1 mt-2 gap-0 text-xs transition [&_button]:scale-75" />
								</div>
							</div>
						</div>
					)}
					<ScrollArea
						className={cn('h-full')}
						style={{
							maxHeight: props.maxHeight
								? 'auto'
								: `calc(100vh - ${headerHeight}px - var(--nav-height))`,
						}}
						viewportRef={scrollAreaRef}
					>
						<Accordion
							type="single"
							collapsible
							className={cn('flex flex-col', wrapperClassName)}
							defaultValue={sectionId || resources[0]?.id}
						>
							<ol className="divide-border dark:divide-foreground/5 divide-y">
								{resources.map((resource: NavigationResource, i: number) => {
									const isActiveGroup =
										(resource.type === 'section' ||
											resource.type === 'lesson') &&
										resource.resources.some(
											(item) => props.currentLessonSlug === item.slug,
										)
									const isSectionCompleted =
										resource.type === 'section' &&
										resource.resources?.every((item) =>
											moduleProgress?.completedLessons?.some(
												(progress) =>
													progress.resourceId === item.id &&
													progress.completedAt,
											),
										)

									return resource.type === 'section' ? (
										// sections
										<li key={`${resource.id}-accordion`}>
											<AccordionItem value={resource.id} className="border-0">
												<AccordionTrigger
													className={cn(
														'bg-card dark:hover:bg-foreground/10 dark:data-[state=open]:bg-card hover:text-primary hover:bg-muted/50 data-[state=open]:bg-muted/50 relative flex w-full items-center rounded-none px-5 py-3 text-left text-base font-semibold leading-tight hover:no-underline',
														{
															'dark:bg-foreground/10 bg-muted/50 text-primary':
																isActiveGroup,
														},
													)}
												>
													<h3 className="flex items-center gap-1.5">
														{isSectionCompleted && (
															<Check className="-ml-1.5 w-4 shrink-0 text-teal-500" />
														)}
														{resource.title}{' '}
														<span className="text-sm opacity-50">
															({resource.resources.length})
														</span>
													</h3>
												</AccordionTrigger>
												{resource.resources.length > 0 && (
													// section lessons
													<AccordionContent className="pb-0">
														<ol className="divide-border bg-background divide-y">
															{resource.resources.map((item, index: number) => {
																return (
																	<LessonResource
																		lesson={item}
																		moduleId={workshopNavigation.id}
																		index={index}
																		moduleProgress={moduleProgress}
																		ability={ability}
																		abilityStatus={abilityStatus}
																		key={item.id}
																	/>
																)
															})}
														</ol>
													</AccordionContent>
												)}
											</AccordionItem>
										</li>
									) : (
										// top-level lessons
										<LessonResource
											className={cn('')}
											lesson={resource}
											index={i}
											moduleProgress={moduleProgress}
											moduleId={workshopNavigation.id}
											ability={ability}
											abilityStatus={abilityStatus}
											key={resource.id}
										/>
									)
								})}
							</ol>
						</Accordion>
					</ScrollArea>
				</div>
				{/* {isCollapsible && isSidebarCollapsed && (
				<TooltipProvider>
					<Tooltip delayDuration={0}>
						<TooltipTrigger asChild>
							<Button
								className="bg-background text-foreground hover:bg-background absolute -left-10 top-5 z-50 hidden h-8 w-8 border p-1 transition lg:flex"
								size="icon"
								type="button"
								onClick={() => {
									setIsSidebarCollapsed(!isSidebarCollapsed)
								}}
							>
								{isSidebarCollapsed ? (
									<PanelLeftOpen className="h-4 w-4" />
								) : (
									<PanelLeftClose className="h-4 w-4" />
								)}
							</Button>
						</TooltipTrigger>
						<TooltipContent className="z-1000" side="right">
							{isSidebarCollapsed ? 'Open sidebar' : 'Collapse sidebar'}
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			)} */}
			</TooltipProvider>
		</nav>
	)
}

const LessonResource = ({
	lesson,
	moduleProgress,
	index,
	ability,
	abilityStatus,
	className,
	moduleId,
}: {
	lesson: NavigationResource
	moduleProgress?: ModuleProgress | null
	index: number
	ability: AppAbility
	abilityStatus: 'error' | 'success' | 'pending'
	className?: string
	moduleId: string
}) => {
	const params = useParams()
	const pathname = usePathname()
	const isOnSolution = pathname.includes('/solution')

	const isActiveSolution =
		lesson.slug === params.lesson && pathname.includes('/solution')
	const isOnExercise = pathname.includes('/exercise')
	const isActiveExercise =
		lesson.slug === params.lesson && pathname.includes('/exercise')

	const isActiveLesson =
		lesson.slug === params.lesson && !isOnSolution && !isOnExercise
	const isActiveGroup =
		(isActiveLesson &&
			lesson.type === 'lesson' &&
			lesson?.resources?.length > 0) ||
		isActiveSolution ||
		isActiveExercise

	const isCompleted = moduleProgress?.completedLessons?.some(
		(progress) => progress.resourceId === lesson.id && progress.completedAt,
	)

	const canViewLesson = ability.can(
		'read',
		subject('Content', { id: lesson.id }),
	)

	const canCreate = ability.can('create', 'Content')
	const hasExercise =
		(lesson?.type === 'lesson' &&
			lesson.resources?.some((r) => r.type === 'exercise')) ||
		false
	const hasSolution =
		(lesson?.type === 'lesson' &&
			lesson.resources?.some((r) => r.type === 'solution')) ||
		false

	return (
		<li
			key={lesson.id}
			className={cn(
				'',
				{
					'bg-card-muted dark:bg-foreground/10': isActiveGroup,
				},
				className,
			)}
			data-active={isActiveLesson ? 'true' : 'false'}
		>
			<div>
				<div className="relative flex w-full items-center">
					{(() => {
						// Base styles shared by both link and non-link variants
						const baseStyles = cn(
							'relative flex w-full items-baseline py-3 pl-3 pr-10 font-medium transition ease-out',
							{
								// Active state
								'bg-card-muted dark:bg-foreground/10 text-primary border-gray-200':
									isActiveLesson && !isActiveGroup,
								// Only add hover styles when the row is actually clickable
								'hover:bg-muted/50 dark:hover:bg-foreground/10 hover:text-primary':
									canViewLesson && !isActiveLesson && !isActiveGroup,
								'hover:bg-muted/50 dark:hover:bg-foreground/10':
									canViewLesson && isActiveGroup,
							},
						)

						// Shared inner content
						const rowContent = (
							<>
								{isCompleted ? (
									<div
										aria-label="Completed"
										className="flex w-6 shrink-0 items-center justify-center pr-1"
									>
										<Check
											aria-hidden="true"
											className="relative h-4 w-4 translate-y-1 text-teal-500 dark:text-teal-300"
										/>
									</div>
								) : (
									<span
										className="relative w-6 shrink-0 -translate-y-0.5 pr-1 text-center text-[10px] font-light text-gray-400"
										aria-hidden="true"
									>
										{index + 1}
									</span>
								)}
								<span className="w-full font-semibold">{lesson.title}</span>
								{abilityStatus === 'success' && !canViewLesson && (
									<Lock
										className="absolute right-5 w-3 text-gray-500"
										aria-label="locked"
									/>
								)}
							</>
						)

						return canViewLesson ? (
							<Link
								className={cn('hover:text-primary', baseStyles)}
								href={`/workshops/${params.module}/${lesson.slug}`}
								prefetch
							>
								{rowContent}
							</Link>
						) : (
							<div className={baseStyles}>{rowContent}</div>
						)
					})()}

					{canCreate ? (
						<Button
							asChild
							variant="outline"
							size="icon"
							className="absolute right-0.5 scale-75"
						>
							<Link href={`/workshops/${params.module}/${lesson.slug}/edit`}>
								<Pen className="w-3" />
							</Link>
						</Button>
					) : null}
				</div>
			</div>
			{(hasSolution || hasExercise) && isActiveGroup && (
				<ul>
					<li data-active={isActiveLesson ? 'true' : 'false'}>
						<Link
							className={cn(
								'relative flex w-full items-baseline py-3 pl-3 pr-10 pt-2 font-medium',
								{
									'pl-9': true,
									'text-primary border-gray-200': isActiveLesson,
									'hover:text-primary': !isActiveLesson,
								},
							)}
							prefetch={true}
							href={`/workshops/${params.module}/${lesson.slug}`}
						>
							Problem
						</Link>
					</li>
					{hasExercise && (
						<li data-active={isActiveExercise ? 'true' : 'false'}>
							<Link
								className={cn(
									'dark:after:bg-muted after:bg-muted relative flex w-full items-baseline py-3 pl-3 pr-10 font-medium after:absolute after:top-0 after:h-px after:w-full after:brightness-95 dark:after:brightness-150',
									{
										'pl-9': true,
										'text-primary border-gray-200': isActiveExercise,
										'hover:text-primary': !isActiveExercise,
									},
								)}
								prefetch={true}
								href={`/workshops/${params.module}/${lesson.slug}/exercise`}
							>
								Exercise
							</Link>
						</li>
					)}
					{hasSolution && (
						<li data-active={isActiveSolution ? 'true' : 'false'}>
							<Link
								className={cn(
									'dark:after:bg-muted after:bg-muted relative flex w-full items-baseline py-2 pb-4 pl-3 pr-10 font-medium after:absolute after:top-0 after:h-px after:w-full after:brightness-95 dark:after:brightness-150',
									{
										'pl-9': true,
										'text-primary border-gray-200': isActiveSolution,
										'hover:text-primary': !isActiveSolution,
									},
								)}
								prefetch={true}
								href={`/workshops/${params.module}/${lesson.slug}/solution`}
							>
								Solution
							</Link>
						</li>
					)}
				</ul>
			)}
		</li>
	)
}
