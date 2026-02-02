'use client'

import Link from 'next/link'
import { ShareBar } from '@/components/share'
import { Github, Share2 } from 'lucide-react'

import {
	Button,
	Dialog,
	DialogContent,
	DialogTitle,
	DialogTrigger,
} from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

export type ResourceActionsProps = {
	/** First resource href for "Start Learning" button */
	firstResourceHref?: string
	/** GitHub repository URL */
	githubUrl?: string
	/** Resource title for share dialog */
	title: string
	/** Additional CSS classes */
	className?: string
}

/**
 * Action buttons for resource landing pages.
 *
 * Provides consistent action buttons:
 * - Start Learning (if firstResourceHref provided)
 * - Code/GitHub link (if githubUrl provided)
 * - Share dialog
 */
export function ResourceActions({
	firstResourceHref,
	githubUrl,
	title,
	className,
}: ResourceActionsProps) {
	return (
		<div className={cn('', className)}>
			<div className="mt-8 flex flex-wrap gap-2">
				{firstResourceHref && (
					<Button size="lg" asChild>
						<Link href={firstResourceHref}>Start Learning</Link>
					</Button>
				)}
				{githubUrl && (
					<Button variant="ghost" size="lg" asChild>
						<Link href={githubUrl} target="_blank">
							<Github className="mr-2 w-3" /> Code
						</Link>
					</Button>
				)}
				<Dialog>
					<DialogTrigger asChild>
						<Button variant="ghost" size="lg">
							<Share2 className="mr-2 w-3" /> Share
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogTitle>Share {title}</DialogTitle>
						<ShareBar />
					</DialogContent>
				</Dialog>
			</div>
		</div>
	)
}
