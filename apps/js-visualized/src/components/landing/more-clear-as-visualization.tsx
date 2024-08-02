import * as React from 'react'
import Image from 'next/image'
import SectionWrapper from '@/components/section-wrapper'
import { cn } from '@/utils/cn'

const MoreClearAsVisualization: React.FC<{ className?: string }> = ({
	className,
}) => {
	return (
		<div className={cn('not-prose', className)}>
			<h3 className="ml-28 max-w-[530px] text-[2.5rem] leading-[1.2] tracking-tight text-white">
				Wouldn't this be more clear
				<br />
				as a{' '}
				<span className="bg-gradient-pink-to-orange bg-clip-text font-bold text-transparent">
					visualization?
				</span>
			</h3>
			<SectionWrapper className="mt-20">
				<div className="bg-red flex w-full justify-center">
					ANIMATED VISUALIZATION
				</div>
			</SectionWrapper>
		</div>
	)
}

export default MoreClearAsVisualization