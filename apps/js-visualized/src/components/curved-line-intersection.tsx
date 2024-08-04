import React from 'react'
import { cn } from '@/utils/cn'

const commonStyles =
	'bg-background absolute size-[calc(var(--curvature-height-sm)/2+1px)] md:size-[calc(var(--curvature-height-md)/2+1px)] lg:size-[calc(var(--curvature-height-lg)/2+1px)] xl:size-[calc(var(--curvature-height-xl)/2+1px)] before:absolute before:inset-0'

const CurvedLineIntersection: React.FC<
	React.PropsWithChildren<{
		className?: string
		positionClassName?: string
		startColor?: string
		endColor?: string
		heightSM?: string
		heightMD?: string
		heightLG?: string
		heightXL?: string
	}>
> = ({
	className,
	positionClassName,
	startColor = 'var(--jsv-hazy-charcoal)',
	endColor = 'var(--jsv-hazy-charcoal)',
	heightSM = '80px',
	heightMD = '120px',
	heightLG = '140px',
	heightXL = '170px',
}) => {
	return (
		<div
			className={cn(
				'relative h-[calc(var(--curvature-height-sm)+1px)] w-full md:h-[calc(var(--curvature-height-md)+1px)] lg:h-[calc(var(--curvature-height-lg)+1px)] xl:h-[calc(var(--curvature-height-xl)+1px)]',
				className,
			)}
			style={
				{
					'--start-color': startColor,
					'--end-color': endColor,
					'--curvature-height-sm': heightSM,
					'--curvature-height-md': heightMD,
					'--curvature-height-lg': heightLG,
					'--curvature-height-xl': heightXL,
				} as React.CSSProperties
			}
		>
			<div
				className={cn(
					'absolute inset-0 bg-gradient-to-r from-[var(--start-color)] to-[var(--end-color)] bg-[length:100%_1px] bg-center bg-no-repeat',
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
