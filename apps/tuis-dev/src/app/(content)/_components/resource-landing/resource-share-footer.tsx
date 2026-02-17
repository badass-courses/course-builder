import * as Share from '@/components/share'

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
					<Share.Root
						className="flex flex-row flex-wrap gap-1 sm:items-center"
						title={title}
					>
						<Share.Bluesky className="[&_span]:hidden sm:[&_span]:inline-block">
							Share on Bluesky
						</Share.Bluesky>
						<Share.X className="[&_span]:hidden sm:[&_span]:inline-block">
							Tweet
						</Share.X>
						<Share.LinkedIn className="[&_span]:hidden sm:[&_span]:inline-block">
							Share on LinkedIn
						</Share.LinkedIn>
						<Share.CopyUrl />
					</Share.Root>
				</div>
			</div>
		</div>
	)
}
