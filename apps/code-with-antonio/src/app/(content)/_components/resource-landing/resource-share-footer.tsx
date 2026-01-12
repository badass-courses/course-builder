import { Share } from '@/components/share'

export type ResourceShareFooterProps = {
	/** Resource title for sharing */
	title: string
	/** Additional CSS classes */
	className?: string
}

/**
 * Footer share section for resource landing pages.
 *
 * Provides consistent share UI at the bottom of resource pages.
 */
export function ResourceShareFooter({
	title,
	className,
}: ResourceShareFooterProps) {
	return (
		<div className={className}>
			<div className="">
				<div className="">
					<strong className="">Share</strong>
					<Share className="" title={title} />
				</div>
			</div>
		</div>
	)
}
