import * as React from 'react'
import { cn } from '@/utils/cn'

const SectionWrapper: React.FC<
	React.PropsWithChildren<{ className?: string }>
> = ({ children, className }) => {
	return (
		<div className={cn('bg-card rounded-[2.5rem] p-24', className)}>
			{children}
		</div>
	)
}

export default SectionWrapper
