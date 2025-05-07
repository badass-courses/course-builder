'use client'

import { use, useState } from 'react'
import type { Lesson } from '@/lib/lessons'
import { track } from '@/utils/analytics'
import { getAdjacentWorkshopResources } from '@/utils/get-adjacent-workshop-resources'
import { Sparkle } from 'lucide-react'

import type { ContentResource } from '@coursebuilder/core/schemas'
import { Button } from '@coursebuilder/ui'
import type { ButtonProps } from '@coursebuilder/ui/primitives/button'
import { cn } from '@coursebuilder/ui/utils/cn'
import type { AbilityForResource } from '@coursebuilder/utils-auth/current-ability-rules'

import { useWorkshopNavigation } from './workshop-navigation-provider'

/**
 * Renders a button to copy the lesson body (problem prompt) to the clipboard.
 * This button is only shown if the next resource in the workshop navigation is a solution.
 */
export function CopyProblemPromptButton({
	lesson,
	abilityLoader,
	className,
	...rest
}: {
	lesson: Lesson | ContentResource
	className?: string
	abilityLoader: Promise<AbilityForResource>
} & ButtonProps) {
	const ability = use(abilityLoader)
	const canView = ability?.canView
	const workshopNavigation = useWorkshopNavigation()
	const [copied, setCopied] = useState(false)

	if (!canView) {
		return null
	}

	if (!workshopNavigation) {
		return null // Don't render if context is null
	}

	const isProblemLesson = Boolean(
		lesson?.resources?.find((r) => r.resource.type === 'solution'),
	)

	if (!isProblemLesson) {
		return null
	}

	const handleCopy = async () => {
		// Access body via lesson.fields.body
		if (lesson.fields?.body) {
			await navigator.clipboard.writeText(lesson.fields.body)
			track('Problem Prompt Copied', { lessonId: lesson.id })
			setCopied(true)
			setTimeout(() => setCopied(false), 2000) // Reset after 2 seconds
		}
	}

	return (
		<Button
			onClick={handleCopy}
			variant="outline"
			size="sm"
			className={cn('h-11 text-base', className)}
			type="button"
			{...rest}
		>
			<span className="relative inline-flex h-full w-full items-center justify-center">
				<span
					aria-hidden={copied}
					className={cn('flex items-center gap-1 transition-opacity', {
						'opacity-0': copied,
					})}
				>
					<Sparkle className="size-4" /> Copy Prompt
				</span>
				<span
					aria-hidden={!copied}
					className={cn(
						'absolute left-0 top-0 flex h-full w-full items-center justify-center transition-opacity',
						{ 'opacity-0': !copied },
					)}
				>
					Copied!
				</span>
			</span>
		</Button>
	)
}
