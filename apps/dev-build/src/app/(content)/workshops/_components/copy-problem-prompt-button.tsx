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
	problem,
	...rest
}: {
	lesson: Lesson | ContentResource
	problem?: Lesson | null
	className?: string
	abilityLoader: Promise<
		Omit<AbilityForResource, 'canView'> & {
			canViewWorkshop: boolean
			canViewLesson: boolean
			isPendingOpenAccess: boolean
		}
	>
} & ButtonProps) {
	const ability = use(abilityLoader)
	const canView = ability?.canViewLesson
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

	const isSolutionLesson = lesson?.type === 'solution'

	const prompt = problem?.fields?.prompt || lesson.fields?.prompt

	if (!prompt) {
		return null
	}

	const handleCopy = async () => {
		// Access body via lesson.fields.body
		if (prompt) {
			await navigator.clipboard.writeText(prompt)
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
			className={cn('group h-11 px-5 text-base', className)}
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
					<svg
						className="dark:text-primary mr-1 size-4 text-amber-500"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 15 15"
					>
						<path
							stroke="currentColor"
							strokeLinecap="round"
							className="transition ease-in-out"
							fill="currentColor"
							strokeLinejoin="round"
							d="M1 7.75A6.75 6.75 0 0 0 7.75 1a6.75 6.75 0 0 0 6.75 6.75 6.75 6.75 0 0 0-6.75 6.75A6.75 6.75 0 0 0 1 7.75Z"
						/>
					</svg>
					{/* <Sparkle className="dark:text-primary size-4 text-orange-600" /> */}
					Copy Prompt
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
