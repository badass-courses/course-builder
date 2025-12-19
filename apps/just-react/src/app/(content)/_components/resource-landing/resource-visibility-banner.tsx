import { Construction } from 'lucide-react'

import { cn } from '@coursebuilder/ui/utils/cn'

export type ResourceVisibilityBannerProps = {
	/** Resource visibility state */
	visibility?: 'public' | 'private' | 'unlisted'
	/** Resource type for display */
	resourceType: string
	/** Additional CSS classes */
	className?: string
}

/**
 * Visibility banner shown when a resource is not publicly visible.
 *
 * Displays a banner at the top of resource pages when visibility is not 'public'.
 * Used across all resource types: events, workshops, cohorts, lists.
 */
export function ResourceVisibilityBanner({
	visibility,
	resourceType,
	className,
}: ResourceVisibilityBannerProps) {
	if (visibility === 'public') {
		return null
	}

	return (
		<div
			className={cn(
				'bg-size-[24px_32px] dark:bg-size-[24px_32px] relative flex w-full items-center justify-center gap-2 border-b bg-[url(https://res.cloudinary.com/total-typescript/image/upload/v1740997576/aihero.dev/assets/side-pattern-light-r_2x_y6fcsw.png)] bg-repeat p-3 text-center dark:bg-[url(https://res.cloudinary.com/total-typescript/image/upload/v1740997576/aihero.dev/assets/side-pattern-dark-r_2x_wytllo.png)]',
				className,
			)}
		>
			<Construction className="h-4 w-4" />{' '}
			<p className="text-sm font-medium capitalize">
				{visibility} {resourceType}
			</p>
		</div>
	)
}
