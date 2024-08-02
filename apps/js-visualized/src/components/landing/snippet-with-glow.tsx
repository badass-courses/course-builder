import * as React from 'react'
import Image from 'next/image'
import { cn } from '@/utils/cn'

const SnippetWithGlow: React.FC<
	React.PropsWithChildren<{ className?: string }>
> = ({ className }) => {
	return (
		<div className={cn('not-prose flex flex-col items-center', className)}>
			<h3 className="max-w-xs text-balance text-center text-xl font-bold text-white md:max-w-md md:text-2xl">
				You probably won't have
				<br />
				any trouble reading this code snippet.
			</h3>
			<div className="relative mt-8 flex justify-center md:mt-20">
				<div className="absolute top-0 h-[158px] w-[247px] flex-shrink-0 rounded-[247px] bg-[linear-gradient(270deg,var(--jsv-purple)_-8.36%,var(--jsv-pink-hot)_102.7%)] blur-[82px] md:h-[170px] md:w-[400px] md:rounded-[400px] md:blur-[134px]" />
				<Image
					src="/images/trouble-reading-this-code-snippet.png"
					alt="You probably won't have any trouble reading this code snippet."
					width={633}
					height={402}
					className="relative z-10 hidden md:block"
				/>
				<Image
					src="/images/trouble-reading-this-code-snippet-mobile.png"
					alt="You probably won't have any trouble reading this code snippet."
					width={780}
					height={618}
					className="relative z-10 md:hidden"
				/>
			</div>
		</div>
	)
}

export default SnippetWithGlow
