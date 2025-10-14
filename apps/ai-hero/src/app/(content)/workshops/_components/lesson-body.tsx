'use client'

import { use } from 'react'
import type { Lesson } from '@/lib/lessons'
import { MinimalWorkshop } from '@/lib/workshops'
import { formatInTimeZone } from 'date-fns-tz'
import { Lock } from 'lucide-react'

import type { AbilityForResource } from '@coursebuilder/utils-auth/current-ability-rules'

export function LessonBody({
	lesson,
	workshop,
	abilityLoader,
	mdxContentPromise,
}: {
	lesson: Lesson | null
	workshop: MinimalWorkshop | null
	abilityLoader: Promise<
		Omit<AbilityForResource, 'canView'> & {
			canViewWorkshop: boolean
			canViewLesson: boolean
			isPendingOpenAccess: boolean
		}
	>
	mdxContentPromise: Promise<{ content: React.ReactNode }>
}) {
	const ability = use(abilityLoader)
	const canView = ability?.canViewLesson

	if (!canView) {
		return (
			<div className="prose dark:prose-invert dark:prose-a:text-primary prose-a:text-orange-600 sm:prose-lg lg:prose-xl max-w-none">
				<p>
					<Lock className="mr-1 inline-block size-5 opacity-75" />{' '}
					{ability.isPendingOpenAccess && workshop?.fields?.startsAt
						? `This lesson is not available yet. Please check back on ${formatInTimeZone(
								new Date(workshop.fields.startsAt),
								workshop?.fields?.timezone || 'America/Los_Angeles',
								`MMM d, yyyy 'at' h:mm a z`,
							)}`
						: ability.isPendingOpenAccess
							? 'This lesson is not available yet.'
							: 'You need to be a member to access this lesson.'}
				</p>
			</div>
		)
	}

	const { content } = use(mdxContentPromise)

	return (
		<div className="prose-img:rounded-lg dark:prose-invert prose dark:prose-a:text-primary prose-a:text-blue-600 lg:prose-pre:text-sm lg:prose-pre:leading-relaxed sm:prose-lg lg:prose-lg max-w-none">
			{content}
		</div>
	)
}
