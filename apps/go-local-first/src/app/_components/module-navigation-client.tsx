'use client'

import React from 'react'
import Link from 'next/link'
import { createAppAbility, type AppAbility } from '@/ability'
import { useWorkshopNavigation } from '@/app/(content)/workshops/_components/workshop-navigation-provider'
import {
	findSectionIdForLessonSlug,
	type NavigationResource,
} from '@/lib/workshops'
import { api } from '@/trpc/react'
import { Check, Lock, Pen } from 'lucide-react'
import pluralize from 'pluralize'

import { Button, ModuleNavigation } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

import { useModuleProgress } from '../(content)/_components/module-progress-provider'

export const ModuleNavigationClient = (props: ModuleNavigation.RootProps) => {
	const { moduleType, moduleSlug, currentResourceSlug } = props
	const workshopNavigation = useWorkshopNavigation()
	const { moduleProgress } = useModuleProgress()
	const currentSectionId = findSectionIdForLessonSlug(
		workshopNavigation,
		currentResourceSlug,
	)
	const { data: abilityRules, status: abilityStatus } =
		api.ability.getCurrentAbilityRules.useQuery({
			moduleId: workshopNavigation?.id,
		})
	const ability = createAppAbility(abilityRules || [])

	return (
		<nav aria-label={`${moduleType} navigation`}>
			<ModuleNavigation.Root {...props} currentGroupId={currentSectionId}>
				{workshopNavigation?.resources.map((resource) => {
					const isCompleted = Boolean(
						moduleProgress?.completedLessons.find(
							({ resourceId }) => resourceId === resource.id,
						),
					)
					const isActiveResource = currentResourceSlug === resource.slug
					const isActiveSection =
						resource.type === 'section' &&
						Boolean(
							resource.lessons.find((l) => l.slug === currentResourceSlug),
						)

					return resource.type === 'section' ? (
						<ModuleNavigation.ResourceGroup
							resource={resource}
							key={resource.id}
						>
							<ModuleNavigation.ResourceGroupTrigger className="py-1 pl-3">
								{resource.title}
								<ModuleNavigation.ResourceIndicator>
									{isActiveSection && (
										<div
											className="bg-primary absolute right-5 h-1 w-1 rounded"
											aria-hidden="true"
										/>
									)}
								</ModuleNavigation.ResourceIndicator>
							</ModuleNavigation.ResourceGroupTrigger>
							<ModuleNavigation.ResourceGroupContent>
								{resource.lessons.map((resource) => {
									const isCompleted = Boolean(
										moduleProgress?.completedLessons.find(
											({ resourceId }) => resourceId === resource.id,
										),
									)
									const isActiveResource = currentResourceSlug === resource.slug

									return (
										<Lesson
											key={resource.id}
											isActive={isActiveResource}
											isCompleted={isCompleted}
											resource={resource}
											moduleType={moduleType}
											moduleSlug={moduleSlug}
											ability={ability}
											abilityStatus={abilityStatus}
										/>
									)
								})}
							</ModuleNavigation.ResourceGroupContent>
						</ModuleNavigation.ResourceGroup>
					) : (
						<Lesson
							key={resource.id}
							isActive={isActiveResource}
							isCompleted={isCompleted}
							resource={resource}
							moduleType={moduleType}
							moduleSlug={moduleSlug}
							ability={ability}
							abilityStatus={abilityStatus}
						/>
					)
				})}
			</ModuleNavigation.Root>
		</nav>
	)
}

const Lesson = ({
	isActive,
	resource,
	isCompleted,
	moduleType,
	moduleSlug,
	ability,
	abilityStatus,
}: {
	isActive: boolean
	resource: NavigationResource
	isCompleted: boolean
	moduleType: string
	moduleSlug: string
	ability: AppAbility
	abilityStatus: 'error' | 'success' | 'pending'
}) => {
	const canView = ability.can('read', 'Content')
	const canEdit = ability.can('create', 'Content')

	return (
		<ModuleNavigation.Resource
			asChild
			className={cn('py-1', {
				'text-primary': isActive,
			})}
			resource={resource}
		>
			<Link href={`/${pluralize(moduleType)}/${moduleSlug}/${resource.slug}`}>
				<ModuleNavigation.ResourceIndicator className="h-3 w-3">
					{isCompleted && <Check className="h-3 w-3" aria-hidden="true" />}
					{!canView && abilityStatus === 'success' && (
						<Lock className="h-3 w-3" aria-hidden="true" />
					)}
				</ModuleNavigation.ResourceIndicator>
				{resource.title}
				{isCompleted && <div className="sr-only">(Completed)</div>}
				{!canView && abilityStatus === 'success' && (
					<div className="sr-only">(Locked)</div>
				)}
				{canEdit && (
					<Button asChild variant="outline" size="icon" className="h-4 w-4">
						<Link
							href={`/${pluralize(moduleType)}/${moduleSlug}/${resource.slug}/edit`}
						>
							<Pen className="w-3" />
						</Link>
					</Button>
				)}
			</Link>
		</ModuleNavigation.Resource>
	)
}
