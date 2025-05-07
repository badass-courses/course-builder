'use client'

import { use } from 'react'
import type { Lesson } from '@/lib/lessons'

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
			<article className="prose dark:prose-a:text-primary prose-a:text-orange-600 sm:prose-lg lg:prose-xl prose-p:max-w-4xl prose-headings:max-w-4xl prose-ul:max-w-4xl prose-table:max-w-4xl prose-pre:max-w-4xl mt-10 max-w-none [&_[data-pre]]:max-w-4xl">
				<p>This lesson is locked. Please upgrade to view it.</p>
			</article>
		)
	}

	const { content } = use(mdxContentPromise)

	return (
		<article className="prose-img:rounded-lg prose dark:prose-a:text-primary prose-a:text-orange-600 sm:prose-lg lg:prose-xl prose-p:max-w-4xl prose-headings:max-w-4xl prose-ul:max-w-4xl prose-table:max-w-4xl prose-pre:max-w-4xl mt-10 max-w-none [&_[data-pre]]:max-w-4xl">
			{content}
		</article>
	)
}
