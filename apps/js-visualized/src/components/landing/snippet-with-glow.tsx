import * as React from 'react'
import Image from 'next/image'
import { cn } from '@/utils/cn'

const SnippetWithGlow: React.FC<
	React.PropsWithChildren<{ className?: string }>
> = ({ className }) => {
	return (
		<div className={cn('not-prose flex flex-col items-center', className)}>
			<h3 className="text-balance text-center text-2xl font-bold text-white">
				You probably won't have
				<br />
				any trouble reading this code snippet.
			</h3>
			<div className="relative mt-20 flex justify-center">
				<div className="absolute top-0 h-[100px] w-[250px] flex-shrink-0 rounded-[250px] bg-[linear-gradient(270deg,#FF007F_-8.36%,#771FFF_102.7%)] blur-[100px] md:h-[170px] md:w-[400px] md:rounded-[400px] md:blur-[134px]" />
				<Image
					src="/images/trouble-reading-this-code-snippet.png"
					alt="You probably won't have any trouble reading this code snippet."
					width={633}
					height={402}
					className="relative z-10"
				/>
			</div>
		</div>
	)
}

export default SnippetWithGlow
