'use client'

import * as React from 'react'
import { Icon } from '@/components/icons'
import { cn } from '@/utils/cn'

const Introducing: React.FC<{ className?: string }> = ({ className }) => {
	return (
		<div
			className={cn(
				'not-prose mx-auto flex max-w-[850px] flex-col items-center',
				className,
			)}
		>
			<h3 className="text-sm font-medium uppercase tracking-widest">
				Introducing
			</h3>
			<h2 className="text-body-text mt-4 flex flex-col text-[2rem] leading-tight sm:flex-row sm:text-5xl">
				<span>JavaScript</span>{' '}
				<span className="bg-gradient-green-to-blue bg-clip-text font-black text-transparent">
					Visualized
				</span>
			</h2>
			<p className="text-body-text-alt mt-8 text-center text-lg leading-relaxed sm:text-xl sm:leading-relaxed">
				JavaScript Visualized is designed to provide you with a deep,
				comprehensive understanding of JavaScript's internals, without relying
				on oversimplified metaphors or getting bogged down by boredom.
			</p>
			<div className="mt-24 w-full">
				<h3 className="text-xl font-bold text-white">
					With JavaScript Visualized, you will:
				</h3>
				<ul className="mt-16 space-y-10">
					{copy.map((item, i) => {
						return (
							<li key={i} className="flex items-center gap-6">
								<div className="bg-jsv-charcoal flex size-20 shrink-0 items-center justify-center rounded-[2rem]">
									{item.icon}
								</div>
								<div className="text-body-text text-lg leading-[1.777]">
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
