'use client'

import { use } from 'react'
import type { Lesson } from '@/lib/lessons'
import { Lock } from 'lucide-react'

import type { AbilityForResource } from '@coursebuilder/utils-auth/current-ability-rules'

export function LessonBody({
	lesson,
	abilityLoader,
	mdxContentPromise,
}: {
	lesson: Lesson | null
	abilityLoader: Promise<AbilityForResource>
	mdxContentPromise: Promise<{ content: React.ReactNode }>
}) {
	const ability = use(abilityLoader)
	const canView = ability?.canView

	if (!canView) {
		return (
			<div className="prose dark:prose-a:text-primary prose-a:text-orange-600 sm:prose-lg lg:prose-xl max-w-none">
				<p>
					<Lock className="mr-1 inline-block size-5 opacity-75" /> You need to
					be a member to access this lesson.
				</p>
			</div>
		)
	}

	const { content } = use(mdxContentPromise)

	return (
		<div className="prose-img:rounded-lg prose dark:prose-a:text-primary prose-a:text-orange-600 sm:prose-lg lg:prose-xl max-w-none">
			{content}
		</div>
	)
}
