'use client'

import { createAppAbility } from '@/ability'
import { useModuleProgress } from '@/app/(content)/_components/module-progress-provider'
import { useWorkshopNavigation } from '@/app/(content)/workshops/_components/workshop-navigation-provider'
import type { Workshop } from '@/lib/workshops'
import { api } from '@/trpc/react'
import { Check } from 'lucide-react'

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

import { WorkshopLessonItem } from './workshop-lesson-item'

/**
 * Renders a list of workshop resources (lessons and sections) in the cohort view.
 * Handles nested section structures with collapsible accordions.
 * Uses workshopNavigation from context which has full depth (sections + their children).
 */
export function WorkshopLessonList({
	workshop,
	className,
	workshopIndex,
}: {
	workshop: Workshop
	className?: string
	workshopIndex: number
}) {
	const workshopNavigation = useWorkshopNavigation()
	const { moduleProgress } = useModuleProgress()

	const { data: abilityRules, status: abilityStatus } =
		api.ability.getCurrentAbilityRules.useQuery(
			{
				moduleId: workshopNavigation?.id,
			},
			{
				enabled: !!workshopNavigation?.id,
			},
		)

	const ability = createAppAbility(abilityRules || [])

	// Use workshopNavigation.resources which has full depth from getCachedWorkshopNavigation
	const resources = workshopNavigation?.resources ?? []

	let lessonCounter = 0
	let sectionCounter = 0

	return (
		<>
			{resources.map(({ resource }) => {
				if (resource.type === 'section') {
					sectionCounter++
					const sectionIndex = `${workshopIndex}.${sectionCounter}`
					const childResources =
						resource.resources?.map((r) => r.resource).filter(Boolean) || []

					const isSectionCompleted =
						childResources.length > 0 &&
						childResources.every((item) =>
							moduleProgress?.completedLessons?.some(
								(progress) =>
									progress.resourceId === item.id && progress.completedAt,
							),
						)

					return (
						<li key={resource.id} className="relative w-full list-none">
							<Accordion type="multiple">
								<AccordionItem value={resource.id} className="border-0">
									<AccordionTrigger
										className={cn(
											'text-foreground/90 hover:dark:text-primary hover:bg-card hover:dark:bg-foreground/2 relative inline-flex min-h-12 w-full items-center py-2.5 pl-[52px] pr-5 text-base font-semibold leading-tight transition ease-out hover:text-blue-600 hover:no-underline sm:min-h-11',
											className,
										)}
									>
										{isSectionCompleted ? (
											<Check
												className="text-primary absolute left-4 size-3"
												aria-hidden="true"
											/>
										) : (
											<span className="text-muted-foreground absolute left-3 pl-1 text-[10px] opacity-75">
												{sectionIndex}
											</span>
										)}
										{resource.fields?.title}
									</AccordionTrigger>
									{childResources.length > 0 && (
										<AccordionContent className="pb-0">
											<ol className="divide-border divide-y border-t">
												{childResources.map((item, lessonIndex) => {
													lessonCounter++
													return (
														<WorkshopLessonItem
															index={`${sectionIndex}.${lessonIndex + 1}`}
															className={cn('pl-18', className)}
															key={item.id}
															resource={item}
															workshopSlug={workshop.fields.slug}
															ability={ability}
															abilityStatus={abilityStatus}
														/>
													)
												})}
											</ol>
										</AccordionContent>
									)}
								</AccordionItem>
							</Accordion>
						</li>
					)
				}

				// Top-level lesson (not in a section)
				lessonCounter++
				return (
					<WorkshopLessonItem
						index={`${workshopIndex}.${lessonCounter}`}
						className={cn('', className)}
						key={resource.id}
						resource={resource}
						workshopSlug={workshop.fields.slug}
						ability={ability}
						abilityStatus={abilityStatus}
					/>
				)
			})}
		</>
	)
}
