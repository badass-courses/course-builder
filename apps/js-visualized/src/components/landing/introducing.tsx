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
			<h2 className="mt-4 text-5xl">
				JavaScript{' '}
				<span className="bg-gradient-green-to-blue bg-clip-text font-black text-transparent">
					Visualized
				</span>
			</h2>
			<p className="text-foreground mt-8 text-center">
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
								<div className="flex size-20 shrink-0 items-center justify-center rounded-[2rem] bg-[hsla(200,8%,15%,0.4)]">
									{item.icon}
								</div>
								<div className="text-lg leading-[1.777]">{item.text}</div>
							</li>
						)
					})}
				</ul>
			</div>
		</div>
		// <div className="flex flex-col space-y-1">
		// 	<Icon name="ClosingTag" size="32" viewBox="0 0 32 32" />
		// 	<Icon name="Js" size="32" viewBox="0 0 32 32" />
		// 	<Icon name="Rocket" size="32" viewBox="0 0 32 32" />
		// 	<Icon name="Puzzle" size="32" viewBox="0 0 32 32" />
		// </div>
	)
}

export default Introducing

const copy = [
	{
		icon: <Icon name="ClosingTag" size="32" viewBox="0 0 32 32" />,
		text: 'Gain the expertise to develop your own libraries and frameworks, understanding the foundational principles behind libraries and tools like React and Node.js',
	},
	{
		icon: <Icon name="Js" size="32" viewBox="0 0 32 32" />,
		text: 'Establish yourself as an indispensable JavaScript expert, armed with the knowledge to resolve complex issues and debug challenging code',
	},
	{
		icon: <Icon name="Rocket" size="32" viewBox="0 0 32 32" />,
		text: 'Write faster, more efficient code while minimizing errors, by leveraging JavaScript&apos;s built-in features for peak performance',
	},
	{
		icon: <Icon name="Puzzle" size="32" viewBox="0 0 32 32" />,
		text: 'Experience indescribable satisfaction as concepts click into place, reminding you why you fell in love with code in the first place',
	},
]
