'use client'

import * as React from 'react'
import { Icon } from '@/components/icons'
import { cn } from '@/utils/cn'

const Introducing: React.FC<{ className?: string }> = ({ className }) => {
	return (
		<div
			className={cn(
				'not-prose mx-auto flex max-w-[850px] flex-col items-center text-center sm:text-left',
				className,
			)}
		>
			<h3 className="text-sm font-medium uppercase tracking-widest">
				Introducing
			</h3>
			<h2 className="text-body-text mt-4 max-w-xs text-center text-[2rem] leading-tight md:max-w-none md:text-4xl md:leading-tight lg:text-5xl lg:leading-tight">
				JavaScript{' '}
				<span className="bg-gradient-green-to-blue bg-clip-text font-bold text-transparent sm:font-black">
					Visualized
				</span>
			</h2>
			<p className="text-body-text-alt mt-8 text-center text-lg leading-relaxed sm:text-xl sm:leading-relaxed">
				JavaScript Visualized is designed to provide you with a deep,
				comprehensive understanding of JavaScript's internals, without relying
				on oversimplified metaphors or getting bogged down by boredom.
			</p>
			<div className="mt-6 w-full sm:mt-12 md:mt-24">
				<h3 className="text-center text-lg font-bold text-white sm:text-xl md:text-left">
					With JavaScript Visualized, you will:
				</h3>
				<ul className="mt-10 space-y-8 sm:space-y-10 md:mt-16">
					{copy.map((item, i) => {
						return (
							<li
								key={i}
								className="flex flex-col items-center gap-6 sm:flex-row"
							>
								<div className="bg-jsv-charcoal flex size-20 shrink-0 items-center justify-center rounded-[2rem]">
									{item.icon}
								</div>
								<div className="text-body-text text-lg leading-normal sm:leading-[1.777]">
									{item.text}
								</div>
							</li>
						)
					})}
				</ul>
			</div>
		</div>
	)
}

export default Introducing

const copy = [
	{
		icon: <Icon name="ClosingTag" size="48" viewBox="0 0 48 48" />,
		text: 'Gain the expertise to develop your own libraries and frameworks, understanding the foundational principles behind libraries and tools like React and Node.js',
	},
	{
		icon: <Icon name="Js" size="48" viewBox="0 0 48 48" />,
		text: 'Establish yourself as an indispensable JavaScript expert, armed with the knowledge to resolve complex issues and debug challenging code',
	},
	{
		icon: <Icon name="Rocket" size="48" viewBox="0 0 48 48" />,
		text: 'Write faster, more efficient code while minimizing errors, by leveraging JavaScript&apos;s built-in features for peak performance',
	},
	{
		icon: <Icon name="Puzzle" size="48" viewBox="0 0 48 48" />,
		text: 'Experience indescribable satisfaction as concepts click into place, reminding you why you fell in love with code in the first place',
	},
]
