import { Construction } from 'lucide-react'

import { Badge } from '@coursebuilder/ui'
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
		<Badge
			className={cn(
				'mt-4 inline-flex items-center justify-center gap-2 border',
				className,
			)}
			variant="secondary"
		>
			<Construction className="h-4 w-4" />{' '}
			<span className="text-sm font-medium capitalize">
				{visibility} {resourceType}
			</span>
		</Badge>
	)
}
