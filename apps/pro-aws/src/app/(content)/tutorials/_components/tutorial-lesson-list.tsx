'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createAppAbility } from '@/ability'
import { CldImage } from '@/app/_components/cld-image'
import { api } from '@/trpc/react'
import { cn } from '@/utils/cn'
import { getResourceSection } from '@/utils/get-resource-section'
import { CheckIcon, PencilIcon } from '@heroicons/react/24/outline'

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

type ContentResourceProps = {
	tutorial: ContentResource | null
	lesson?: ContentResource | null
	section?: ContentResource | null
	moduleProgress: ModuleProgress
	className?: string
	maxHeight?: string
	withHeader?: boolean
}

type ContentResourceLoaderProps = {
	tutorialLoader: Promise<ContentResource | null>
	lessonLoader: Promise<ContentResource | null>
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

	const className = 'className' in props ? props.className : ''
	const withHeader = 'withHeader' in props ? props.withHeader : true
	const maxHeight =
		'maxHeight' in props ? props.maxHeight : 'h-[calc(100vh-var(--nav-height))]'

	const { data: abilityRules } = api.ability.getCurrentAbilityRules.useQuery()
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

	if (!tutorial) {
		return null
	}

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
										href="/tutorials"
										className="font-heading text-primary text-lg font-medium hover:underline"
									>
										Tutorials
									</Link>
									<span className="opacity-50">/</span>
								</div>
								<Link
									className="font-heading text-balance text-2xl font-bold hover:underline"
									href={`/tutorials/${tutorial?.fields?.slug}`}
								>
									{tutorial?.fields?.title}
								</Link>
							</div>
						</div>
					)}
					<Accordion
						type="single"
						collapsible
						className="flex flex-col border-t pb-16"
						defaultValue={section?.id || tutorial?.resources?.[0]?.resource?.id}
					>
						{tutorial?.resources?.map((resource) => {
							return (
								<AccordionItem
									value={resource.resourceId}
									key={resource.resourceId}
								>
									{resource.resource.type === 'section' ? (
										// section
										<AccordionTrigger className="relative flex w-full items-center px-5 py-5 text-lg font-bold">
											<h3>{resource.resource.fields.title}</h3>
											{section?.id === resource.resourceId && (
												<div className="bg-primary absolute right-12 h-1 w-1 rounded-full" />
											)}
										</AccordionTrigger>
									) : (
										// top-level lessons
										<div className="flex w-full flex-row hover:bg-gray-900">
											<Link
												className="w-full"
												href={`/tutorials/${tutorial?.fields?.slug}/${resource.resource.fields.slug}`}
											>
												{resource.resource.fields.title}
											</Link>
											{ability.can('create', 'Content') ? (
												<div className="w-full justify-end">
													<Button asChild size="sm">
														<Link
															className="text-xs"
															href={`/tutorials/${tutorial?.fields?.slug}/${resource.resource.fields.slug}/edit`}
														>
															edit
														</Link>
													</Button>
												</div>
											) : null}
										</div>
									)}
									{resource.resource.resources.length > 0 && (
										// section lessons
										<AccordionContent>
											<ol>
												{resource.resource.resources.map(
													(lesson: ContentResourceResource, i: number) => {
														const isActive =
															lesson.resource.fields.slug === params.lesson
														const isCompleted =
															moduleProgress?.completedLessons?.some(
																(progress) =>
																	progress.contentResourceId ===
																		lesson.resourceId && progress.completedAt,
															)

														return (
															<li
																key={lesson.resourceId}
																className="flex w-full items-center"
																ref={isActive ? activeResourceRef : undefined}
															>
																<Link
																	className={cn(
																		'hover:bg-secondary flex w-full items-baseline px-5 py-3',
																		{
																			'bg-secondary text-primary': isActive,
																		},
																	)}
																	href={`/tutorials/${tutorial.fields?.slug}/${lesson.resource.fields.slug}`}
																>
																	{isCompleted ? (
																		<span
																			aria-label="Completed"
																			className="w-6 pr-1"
																		>
																			<CheckIcon
																				aria-hidden="true"
																				className="text-primary relative w-4 -translate-x-1 translate-y-1"
																			/>
																		</span>
																	) : (
																		<span
																			className="w-6 pr-1 text-sm opacity-60"
																			aria-hidden="true"
																		>
																			{i + 1}
																		</span>
																	)}

																	{lesson.resource.fields.title}
																</Link>
																{ability.can('create', 'Content') ? (
																	<Button
																		asChild
																		variant="outline"
																		size="icon"
																		className="scale-75"
																	>
																		<Link
																			href={`/tutorials/${tutorial?.fields?.slug}/${lesson.resource.fields.slug}/edit`}
																		>
																			<PencilIcon className="w-3" />
																		</Link>
																	</Button>
																) : null}
															</li>
														)
													},
												)}
											</ol>
										</AccordionContent>
									)}
								</AccordionItem>
							)
						})}
					</Accordion>
				</ScrollArea>
				<div
					className="from-background via-background pointer-events-none absolute -bottom-10 left-0 z-50 h-32 w-full bg-gradient-to-t to-transparent"
					aria-hidden="true"
				/>
			</div>
		</nav>
	)
}
