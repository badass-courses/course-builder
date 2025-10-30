'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { createAppAbility, type AppAbility } from '@/ability'
import { useModuleProgress } from '@/app/(content)/_components/module-progress-provider'
import { useWorkshopNavigation } from '@/app/(content)/workshops/_components/workshop-navigation-provider'
import { CldImage } from '@/components/cld-image'
import {
	findSectionIdForResourceSlug,
	type Level1ResourceWrapper,
	type Level2ResourceWrapper,
} from '@/lib/content-navigation'
import { api } from '@/trpc/react'
import { cn } from '@/utils/cn'
import { subject } from '@casl/ability'
import {
	Check,
	Lock,
	PanelLeftClose,
	PanelLeftOpen,
	Pen,
	Play,
} from 'lucide-react'
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
		'maxHeight' in props ? props.maxHeight : 'h-[calc(100vh-var(--nav-height))]'
	const isCollapsible = 'isCollapsible' in props ? props.isCollapsible : true

	const workshopNavigation = useWorkshopNavigation()
	const { moduleProgress } = useModuleProgress()

	const { data: abilityRules, status: abilityStatus } =
		api.ability.getCurrentAbilityRules.useQuery(
			{
				moduleId: workshopNavigation?.id,
				lessonId: props.currentLessonSlug,
			},
			{
				enabled: !!workshopNavigation?.id,
			},
		)

	const ability = createAppAbility(abilityRules || [])

	const sectionId = findSectionIdForResourceSlug(
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

	// Parents are cohorts or other parent resources
	const cohort = workshopNavigation.parents?.[0]

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
			className={cn(
				'bg-muted/50 relative w-full max-w-xs shrink-0 border-r',
				className,
				{
					'border-r': !isSidebarCollapsed,
					'hover:bg-muted/80 w-8 cursor-pointer transition [&_div]:hidden':
						isSidebarCollapsed && isCollapsible,
				},
			)}
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
				<div className={cn('sticky top-0 overflow-hidden', maxHeight)}>
					{withHeader && (
						<div
							ref={ref as any}
							className={cn('relative z-10 w-full border-b pl-2')}
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
											href={
												cohort
													? `/cohorts/${cohort.fields?.slug}`
													: '/workshops'
											}
											className="text-foreground text-base font-normal opacity-75 hover:underline dark:font-light dark:opacity-100"
										>
											{cohort ? cohort.fields?.title : 'Workshops'}
										</Link>
										<span className="px-1 font-mono opacity-50">/</span>
									</div>
									<Link
										className="font-heading text-balance text-lg font-bold leading-tight tracking-tight hover:underline xl:text-xl xl:leading-tight"
										href={`/workshops/${workshopNavigation.fields?.slug}`}
									>
										{workshopNavigation.fields?.title}
									</Link>
									<AutoPlayToggle className="text-muted-foreground hover:[&_label]:text-foreground relative z-10 -ml-1 mt-2 gap-0 text-xs transition [&_button]:scale-75" />
								</div>
							</div>
							<div className="bg-size-[14px_14px] absolute inset-0 z-0 h-full w-full bg-transparent bg-[radial-gradient(rgba(0,0,0,0.06)_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)]" />
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
							defaultValue={sectionId || resources?.[0]?.resource?.id}
						>
							<ol className="">
								{resources
									?.filter((r) => r?.resource)
									.map(({ resource, metadata }, i: number) => {
										const childResources =
											resource.resources
												?.map((r) => r.resource)
												.filter(Boolean) || []
										const isActiveGroup =
											(resource.type === 'section' ||
												resource.type === 'lesson') &&
											childResources.some(
												(item) => props.currentLessonSlug === item.fields?.slug,
											)
										const isSectionCompleted =
											resource.type === 'section' &&
											childResources.every((item) =>
												moduleProgress?.completedLessons?.some(
													(progress) =>
														progress.resourceId === item.id &&
														progress.completedAt,
												),
											)

										const firstLesson =
											resource.type === 'section' && childResources[0]
										const firstLessonId = firstLesson && firstLesson.id

										const canViewWorkshop =
											firstLessonId &&
											ability.can(
												'read',
												subject('Content', { id: workshopNavigation.id }),
											)

										return resource.type === 'section' ? (
											// sections
											<li key={`${resource.id}-accordion`}>
												<AccordionItem value={resource.id} className="border-0">
													<AccordionTrigger
														className={cn(
															'hover:bg-muted bg-background relative flex min-h-[65px] w-full items-center rounded-none border-b px-5 py-5 text-left text-base font-semibold leading-tight hover:no-underline',
															{
																'bg-muted dark:text-primary text-blue-600':
																	isActiveGroup,
															},
														)}
													>
														<div className="flex w-full items-center">
															<h3 className="flex items-center gap-1 pr-2">
																{isSectionCompleted && (
																	<Check
																		className="-ml-1.5 w-4 shrink-0"
																		aria-hidden="true"
																	/>
																)}
																{resource.fields?.title}
															</h3>
															{childResources.length > 0 && (
																<span className="self-end text-sm font-normal opacity-50">
																	({childResources.length})
																</span>
															)}
														</div>
														<div>
															{abilityStatus === 'success' && (
																<>
																	{metadata?.tier === 'free' &&
																	!canViewWorkshop ? (
																		<div className="text-muted-foreground inline-flex shrink-0 items-center gap-0.5 rounded border px-1.5 py-1 text-xs font-medium leading-none">
																			<Play className="size-3" /> Free
																		</div>
																	) : !canViewWorkshop ? (
																		<Lock className="w-3 text-gray-500" />
																	) : null}
																</>
															)}
														</div>
													</AccordionTrigger>
													{childResources.length > 0 && (
														// section lessons
														<AccordionContent className="pb-0">
															<ol className="divide-border bg-background divide-y border-b">
																{childResources.map((item, index: number) => {
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
												className={cn('border-b')}
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
	lesson: Level1ResourceWrapper['resource'] | Level2ResourceWrapper['resource']
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
	const lessonSlug = lesson.fields?.slug as string
	const childResources = lesson.resources?.map((r) => r.resource) || []
	const solution =
		lesson.type === 'lesson' &&
		childResources.find((resource) => resource.type === 'solution')
	const isActiveSolution =
		lessonSlug === params.lesson && pathname.includes('/solution')

	const isActiveLesson = lessonSlug === params.lesson && !isOnSolution
	const isActiveGroup =
		(isActiveLesson && lesson.type === 'lesson' && childResources.length > 0) ||
		isActiveSolution

	const isCompleted = moduleProgress?.completedLessons?.some(
		(progress) => progress.resourceId === lesson.id && progress.completedAt,
	)

	const canViewLesson = ability.can(
		'read',
		subject('Content', { id: lesson.id }),
	)

	const canCreate = ability.can('create', 'Content')

	return (
		<li
			key={lesson.id}
			className={cn(
				'',
				{
					'bg-muted': isActiveGroup,
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
							'relative flex w-full items-baseline py-3 pl-3 pr-10 font-medium',
							{
								// Active state
								'bg-muted dark:text-primary text-blue-600 border-gray-200':
									isActiveLesson && !isActiveGroup,
								// Only add hover styles when the row is actually clickable
								'hover:bg-muted dark:hover:text-primary hover:text-blue-600':
									canViewLesson && !isActiveLesson && !isActiveGroup,
								'hover:bg-foreground/5 dark:hover:text-primary hover:text-blue-600':
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
											className="text-primary relative h-4 w-4 translate-y-1"
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

								<span className="w-full text-base">{lesson.fields?.title}</span>
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
								className={cn('hover:bg-muted', baseStyles)}
								href={`/workshops/${params.module}/${lesson.fields?.slug}`}
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
							<Link
								href={`/workshops/${params.module}/${lesson.fields?.slug}/edit`}
							>
								<Pen className="w-3" />
							</Link>
						</Button>
					) : null}
				</div>
			</div>
			{solution && isActiveGroup && (
				<ul>
					<li data-active={isActiveLesson ? 'true' : 'false'}>
						<Link
							className={cn(
								'hover:bg-foreground/10 relative flex w-full items-baseline py-3 pl-3 pr-10 font-medium',
								{
									'pl-9': true,
									'bg-foreground/5 dark:text-primary border-gray-200 text-blue-600':
										isActiveLesson,
									'dark:hover:text-primary hover:text-blue-600':
										!isActiveLesson,
								},
							)}
							prefetch={true}
							href={`/workshops/${params.module}/${lesson.fields?.slug}`}
						>
							Problem
						</Link>
					</li>
					<li data-active={isActiveSolution ? 'true' : 'false'}>
						<Link
							className={cn(
								'hover:bg-foreground/10 relative flex w-full items-baseline py-3 pl-3 pr-10 font-medium',
								{
									'pl-9': true,
									'bg-foreground/5 dark:text-primary border-gray-200 text-blue-600':
										isActiveSolution,
									'dark:hover:text-primary hover:text-blue-600':
										!isActiveSolution,
								},
							)}
							prefetch={true}
							href={`/workshops/${params.module}/${lesson.fields?.slug}/solution`}
						>
							Solution
						</Link>
					</li>
				</ul>
			)}
		</li>
	)
}
