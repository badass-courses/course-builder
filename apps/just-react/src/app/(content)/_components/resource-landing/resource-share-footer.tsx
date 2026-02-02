import { ShareBar } from '@/components/share'

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
			<div className="border-t">
				<div className="px-0! container mx-auto flex w-full flex-col items-center justify-center gap-5 border-x pt-5 sm:flex-row sm:pt-0">
					<strong className="text-base font-medium tracking-tight sm:text-lg">
						Share
					</strong>
					<ShareBar
						className="w-full border-t sm:w-auto sm:border-t-0"
						title={title}
					/>
				</div>
			</div>
		</div>
	)
}
