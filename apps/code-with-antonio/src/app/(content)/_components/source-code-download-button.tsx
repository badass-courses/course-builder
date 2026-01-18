'use client'

import Link from 'next/link'
import { track } from '@/utils/analytics'
import { Download, Lock } from 'lucide-react'

import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@coursebuilder/ui'

/**
 * Client component for source code download button with analytics tracking.
 * Used in server components like LessonControls.
 */
export function SourceCodeDownloadButton({
	moduleSlug,
	lessonSlug,
	className,
}: {
	moduleSlug: string
	lessonSlug?: string
	className?: string
}) {
	return (
		<Button asChild variant="outline" className={className}>
			<a
				href={`/api/github/download?workshop=${moduleSlug}`}
				download
				onClick={() => {
					track('source_code_download', {
						workshopSlug: moduleSlug,
						lessonSlug,
						location: 'lesson_controls',
					})
				}}
			>
				<Download className="text-muted-foreground mr-2 h-4 w-4" />
				<span className="inline-block sm:hidden" aria-hidden="true">
					Download
				</span>
				<span className="hidden sm:inline-block">Download Source</span>
			</a>
		</Button>
	)
}

/**
 * Locked source code button that navigates to workshop page for purchase.
 * Shows tooltip explaining access requirements.
 */
export function SourceCodeLockedButton({
	moduleSlug,
	lessonSlug,
	className,
}: {
	moduleSlug: string
	lessonSlug?: string
	className?: string
}) {
	return (
		<TooltipProvider>
			<Tooltip delayDuration={0}>
				<TooltipTrigger asChild>
					<Button asChild variant="outline" className={className}>
						<Link
							href={`/workshops/${moduleSlug}`}
							onClick={() => {
								track('source_code_locked_click', {
									workshopSlug: moduleSlug,
									lessonSlug,
									location: 'lesson_controls',
								})
							}}
						>
							<Lock className="text-muted-foreground mr-2 h-4 w-4" />
							<span className="inline-block sm:hidden" aria-hidden="true">
								Source
							</span>
							<span className="hidden sm:inline-block">Source Code</span>
						</Link>
					</Button>
				</TooltipTrigger>
				<TooltipContent>
					Purchase the workshop to access the source code.
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	)
}
