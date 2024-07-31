import React from 'react'
import { cn } from '@/utils/cn'

const commonStyles =
	'bg-background absolute h-[71px] w-[71px] before:absolute before:inset-0 before:border-border before:content-[""]'

const CurvedLineIntersection: React.FC<
	React.PropsWithChildren<{ className?: string }>
> = ({ className }) => {
	return (
		<div className="relative h-[141px] w-full">
			<div
				className={cn(
					'absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_bottom,transparent_calc(50%_-_0.5px),hsla(var(--border))_calc(50%_-_0.5px),hsla(var(--border))_calc(50%_+_0.5px),transparent_calc(50%_+_0.5px))]',
					className,
				)}
			>
				<div
					className={cn(
						'bottom-0 left-0 before:rounded-tl-full before:border-l before:border-t',
						commonStyles,
					)}
				/>
				<div
					className={cn(
						'right-0 top-0 before:rounded-br-full before:border-b before:border-r ',
						commonStyles,
					)}
				/>
			</div>
		</div>
	)
}

export default CurvedLineIntersection
