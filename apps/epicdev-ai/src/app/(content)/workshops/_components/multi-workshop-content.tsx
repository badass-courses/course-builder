'use client'

import * as React from 'react'
import Link from 'next/link'
import { createAppAbility } from '@/ability'
import { useModuleProgress } from '@/app/(content)/_components/module-progress-provider'
import { useWorkshopNavigation } from '@/app/(content)/workshops/_components/workshop-navigation-provider'
import {
	type NavigationResource,
	type NavigationSection,
} from '@/lib/workshops'
import { api } from '@/trpc/react'
import { cn } from '@/utils/cn'
import { subject } from '@casl/ability'
import { Check, Lock } from 'lucide-react'

import type { ModuleProgress } from '@coursebuilder/core/schemas'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@coursebuilder/ui'

/**
 * Component to display multiple workshops in an accordion format
 * Used specifically for multi-workshop products like "epic-mcp-from-scratch-to-production"
 */
export function MultiWorkshopContent() {
	const workshopNavigation = useWorkshopNavigation()
	const { moduleProgress } = useModuleProgress()

	if (!workshopNavigation || !workshopNavigation.resources) {
		return null
	}

	// Filter to only sections that represent workshops (they have _workshopSlug)
	// The getMultiWorkshopNavigation function adds _workshopSlug and optionally _workshopModuleId to sections
	const workshopSections = workshopNavigation.resources.filter(
		(resource) =>
			resource.type === 'section' &&
			'_workshopSlug' in resource &&
			(resource as any)._workshopSlug !== undefined,
	) as Array<
		NavigationSection & {
			_workshopSlug: string
			_workshopModuleId?: string
		}
	>

	if (workshopSections.length === 0) {
		// Fallback to regular display if no workshop sections found
		return null
	}

	// Fallback: if no _workshopModuleId is present, use parent module ID for ability checks
	const parentModuleId = workshopNavigation.id

	return (
		<ol className="flex flex-col">
			{workshopSections.map((section) => {
				const workshopSlug = section._workshopSlug
				// Use workshop's module ID if available, otherwise fall back to parent module ID
				const workshopModuleId = section._workshopModuleId || parentModuleId
				return (
					<WorkshopSection
						key={section.id}
						section={section}
						workshopSlug={workshopSlug}
						workshopModuleId={workshopModuleId}
						moduleProgress={moduleProgress}
					/>
				)
			})}
		</ol>
	)
}

/**
 * Renders a workshop section with its own ability rules
 * Each workshop needs its own ability check since lessons belong to different workshops
 */
function WorkshopSection({
	section,
	workshopSlug,
	workshopModuleId,
	moduleProgress,
}: {
	section: NavigationSection & {
		_workshopSlug: string
		_workshopModuleId?: string
	}
	workshopSlug: string
	workshopModuleId: string
	moduleProgress?: ModuleProgress | null
}) {
	// Fetch ability rules for this specific workshop
	const { data: abilityRules, status: abilityStatus } =
		api.ability.getCurrentAbilityRules.useQuery(
			{
				moduleId: workshopModuleId,
			},
			{
				enabled: !!workshopModuleId,
			},
		)

	const ability = createAppAbility(abilityRules || [])

	return (
		<li className="bg-card">
			<Accordion type="multiple">
				<AccordionItem value={section.id} className="border-0">
					<div className="relative flex items-center justify-between">
						<Link
							className="text-foreground hover:text-primary hover:bg-muted/50 flex w-full items-center justify-between py-2.5 pl-3 pr-10 text-base font-semibold transition ease-in-out"
							href={`/workshops/${workshopSlug}`}
						>
							{section.title}
						</Link>
						{section.resources && section.resources.length > 0 && (
							<AccordionTrigger
								aria-label="Toggle lessons"
								className="bg-secondary hover:bg-foreground/20 [&_svg]:translate-y-0.3 absolute right-1 top-2 z-10 flex size-6 items-center justify-center rounded py-0"
							/>
						)}
					</div>
					{section.resources && section.resources.length > 0 && (
						<AccordionContent>
							<ol className="divide-border list-inside list-none divide-y border-b">
								{section.resources.map((resource, resourceIndex) => {
									return (
										<WorkshopLessonItem
											key={resource.id}
											resource={resource}
											workshopSlug={workshopSlug}
											index={resourceIndex}
											moduleProgress={moduleProgress}
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

/**
 * Renders a single lesson item within a workshop accordion
 */
function WorkshopLessonItem({
	resource,
	workshopSlug,
	index,
	moduleProgress,
	ability,
	abilityStatus,
}: {
	resource: NavigationResource
	workshopSlug: string
	index: number
	moduleProgress?: ModuleProgress | null
	ability: ReturnType<typeof createAppAbility>
	abilityStatus: 'error' | 'success' | 'pending'
}) {
	const isCompleted = moduleProgress?.completedLessons?.some(
		(progress) => progress.resourceId === resource.id && progress.completedAt,
	)

	const canViewLesson = ability.can(
		'read',
		subject('Content', { id: resource.id }),
	)

	// Handle nested resources (sections within sections)
	if (resource.type === 'section') {
		return (
			<li key={resource.id} className="relative w-full">
				<div className="text-muted-foreground py-2 pl-10 text-sm font-semibold">
					{resource.title}
				</div>
				{resource.resources && resource.resources.length > 0 && (
					<ol className="list-inside list-none">
						{resource.resources.map((nestedResource, nestedIndex) => (
							<WorkshopLessonItem
								key={nestedResource.id}
								resource={nestedResource}
								workshopSlug={workshopSlug}
								index={nestedIndex}
								moduleProgress={moduleProgress}
								ability={ability}
								abilityStatus={abilityStatus}
							/>
						))}
					</ol>
				)}
			</li>
		)
	}

	const renderCompletionStatus = () => {
		return isCompleted ? (
			<Check className="text-primary absolute left-3 size-4" />
		) : (
			<span className="absolute left-3 pl-1 text-xs tabular-nums opacity-75">
				{index + 1}
			</span>
		)
	}

	return (
		<li
			key={resource.id}
			className="border-border relative w-full border-t first:border-t-0"
		>
			{canViewLesson ? (
				<Link
					className="text-foreground/90 hover:text-primary hover:bg-muted/50 inline-flex w-full items-center py-2.5 pl-10 pr-10 text-base font-medium transition ease-in-out"
					href={`/workshops/${workshopSlug}/${resource.slug}`}
				>
					{renderCompletionStatus()}
					{resource.title}
				</Link>
			) : (
				<span className="text-foreground/50 inline-flex w-full cursor-not-allowed items-center py-2.5 pl-10 pr-10 text-base font-medium transition ease-in-out">
					{renderCompletionStatus()}
					{resource.title}
					<Lock
						className="absolute right-5 w-3 text-gray-500"
						aria-label="locked"
					/>
				</span>
			)}
		</li>
	)
}
