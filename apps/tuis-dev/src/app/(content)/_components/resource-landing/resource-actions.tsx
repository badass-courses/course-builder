'use client'

import Link from 'next/link'
import { useModuleProgress } from '@/app/(content)/_components/module-progress-provider'
import { useContentNavigation } from '@/app/(content)/_components/navigation/provider'
import { Share } from '@/components/share'
import {
	flattenNavigationResources,
	getFirstResourceSlug,
} from '@/lib/content-navigation'
import { Github, Share2 } from 'lucide-react'
import { useSession } from 'next-auth/react'

import {
	Button,
	Dialog,
	DialogContent,
	DialogTitle,
	DialogTrigger,
} from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'
import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

export type ResourceActionsProps = {
	/** GitHub repository URL */
	githubUrl?: string
	/** Resource title for share dialog */
	title: string
	/** Additional CSS classes */
	className?: string
	/**
	 * Static href for "Start Learning" button.
	 * @deprecated Use moduleType + moduleSlug for progress-aware mode instead.
	 */
	firstResourceHref?: string
	/**
	 * Module type for progress-aware mode (e.g., "workshop", "list").
	 * When provided with moduleSlug, enables Continue/Start Watching buttons.
	 */
	moduleType?: string
	/** Module slug for URL generation in progress-aware mode */
	moduleSlug?: string
	/** Whether user has access to view the content */
	hasAccess?: boolean
	/** Whether the module requires a purchase (default: true) */
	hasProduct?: boolean
}

/**
 * Action buttons for resource landing pages.
 *
 * Provides consistent action buttons:
 * - Continue Watching / Start Watching (progress-aware when moduleType + moduleSlug provided)
 * - Code/GitHub link (if githubUrl provided)
 * - Share dialog
 *
 * @example Progress-aware mode (workshop)
 * ```tsx
 * <ResourceActions
 *   moduleType="workshop"
 *   moduleSlug={params.module}
 *   hasAccess={canView}
 *   hasProduct={!!product}
 *   githubUrl={workshop?.fields?.github}
 *   title={workshop.fields?.title || ''}
 * />
 * ```
 *
 * @example Basic mode (events, cohorts)
 * ```tsx
 * <ResourceActions
 *   githubUrl={event?.fields?.github}
 *   title={event.fields.title}
 * />
 * ```
 */
export function ResourceActions({
	githubUrl,
	title,
	className,
	firstResourceHref,
	moduleType,
	moduleSlug,
	hasAccess = false,
	hasProduct = true,
}: ResourceActionsProps) {
	// Progress-aware mode when moduleType + moduleSlug provided
	const isProgressAwareMode = Boolean(moduleType && moduleSlug)
	const { data: session } = useSession()

	return (
		<div className={cn('', className)}>
			<div className="mt-8 flex flex-wrap items-center gap-3">
				{isProgressAwareMode ? (
					<ProgressAwareButton
						moduleType={moduleType!}
						moduleSlug={moduleSlug!}
						hasAccess={hasAccess}
						hasProduct={hasProduct}
					/>
				) : (
					firstResourceHref && (
						<Button size="lg" asChild>
							<Link href={firstResourceHref}>Start Learning</Link>
						</Button>
					)
				)}
				{githubUrl && session?.user && (
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
						<Share />
					</DialogContent>
				</Dialog>
			</div>
		</div>
	)
}

/**
 * Internal component for progress-aware Continue/Start Watching button.
 * Separated to allow conditional hook usage.
 */
function ProgressAwareButton({
	moduleType,
	moduleSlug,
	hasAccess,
	hasProduct,
}: {
	moduleType: string
	moduleSlug: string
	hasAccess: boolean
	hasProduct: boolean
}) {
	const { moduleProgress } = useModuleProgress()
	const navigation = useContentNavigation()

	const hasProgress =
		moduleProgress &&
		moduleProgress.completedLessons &&
		moduleProgress.completedLessons.length > 0
	const nextResource = moduleProgress?.nextResource

	// Get first resource for "Start Watching"
	const flatResources = flattenNavigationResources(navigation)
	const firstResource = flatResources[0]
	const firstResourceSlug = getFirstResourceSlug(navigation)

	// Determine which button to show
	const showContinueWatching = hasProgress && nextResource?.fields?.slug
	const showStartWatching =
		!showContinueWatching && (hasAccess || !hasProduct) && firstResourceSlug

	if (showContinueWatching && nextResource) {
		const href = getResourcePath(
			nextResource.type || 'lesson',
			nextResource.fields?.slug || '',
			'view',
			{ parentType: moduleType, parentSlug: moduleSlug },
		)

		return (
			<Button size="lg" className="h-12" asChild>
				<Link href={href}>Continue Watching</Link>
			</Button>
		)
	}

	if (showStartWatching && firstResource) {
		const href = getResourcePath(
			firstResource.type || 'lesson',
			firstResourceSlug || '',
			'view',
			{ parentType: moduleType, parentSlug: moduleSlug },
		)

		return (
			<Button size="lg" className="h-12" asChild>
				<Link href={href}>Start Watching</Link>
			</Button>
		)
	}

	// No button when user lacks access and product is required
	return null
}
