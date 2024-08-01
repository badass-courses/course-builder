import * as React from 'react'
import { cn } from '@/utils/cn'

type SectionWrapperProps = React.PropsWithChildren<{
	className?: string
	[key: string]: any
}>

const SectionWrapper: React.FC<
	React.PropsWithChildren<SectionWrapperProps>
> = ({ children, className, ...rest }) => {
	return (
		<div className={cn('bg-card rounded-[2.5rem] p-24', className)} {...rest}>
			{children}
		</div>
	)
}

export default SectionWrapper
