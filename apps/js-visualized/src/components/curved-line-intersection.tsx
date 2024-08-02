import React from 'react'
import { cn } from '@/utils/cn'

const commonStyles =
	'bg-background absolute h-[71px] w-[71px] before:absolute before:inset-0 before:content-[""]'

const CurvedLineIntersection: React.FC<
	React.PropsWithChildren<{
		className?: string
		positionClassName?: string
		startColor?: string
		endColor?: string
	}>
> = ({
	className,
	positionClassName,
	startColor = 'var(--jsv-hazy-charcoal)',
	endColor = 'var(--jsv-hazy-charcoal)',
}) => {
	return (
		<div
			className={cn('relative h-[141px] w-full', className)}
			style={
				{
					'--start-color': startColor,
					'--end-color': endColor,
				} as React.CSSProperties
			}
		>
			<div
				className={cn(
					'absolute inset-0 before:absolute before:inset-x-0 before:top-[70px] before:h-px before:bg-gradient-to-r before:from-[var(--start-color)] before:to-[var(--end-color)] before:content-[""]',
					positionClassName,
				)}
			>
				<div
					className={cn(
						'bottom-0 left-0 before:rounded-tl-full before:border-l before:border-t before:border-[var(--start-color)]',
						commonStyles,
					)}
				/>
				<div
					className={cn(
						'right-0 top-0 before:rounded-br-full before:border-b before:border-r before:border-[var(--end-color)]',
						commonStyles,
					)}
				/>
			</div>
		</div>
	)
}

export default CurvedLineIntersection
