import React from 'react'
import Image from 'next/image'
import SectionWrapper from '@/components/section-wrapper'
import { cn } from '@/utils/cn'

const urlBase = '/images/logos/'

const WhatYouWillLearn: React.FC<{ className?: string }> = ({ className }) => {
	return (
		<SectionWrapper className={cn('not-prose', className)}>
			<ul className="list-none">
				{copy.map((copy) => {
					return (
						<li
							key={copy.title}
							className="border-border flex items-center gap-14 border-t py-[74px]"
						>
							<div className="w-[200px] shrink-0">
								<Image
									src={`${urlBase}${copy.image}`}
									alt={copy.title}
									width={200}
									height={200}
								/>
							</div>
							<div className="space-y-4">
								<h3 className="text-2xl font-bold leading-tight text-white">
									{copy.title}
								</h3>
								<p>{copy.body}</p>
							</div>
						</li>
					)
				})}
			</ul>
		</SectionWrapper>
	)
}

export default WhatYouWillLearn

const copy = [
	{
		title: 'Parsing and Lexing',
		body: 'Dive deep into the world of code interpretation and uncover how JavaScript breaks down and understands your scripts. By learning about tokens and syntax errors, you&apos;ll lay a strong foundation for writing cleaner, error-free code.',
		image: 'logo-parsing-and-lexing.svg',
	},
	{
		title: 'Abstract Syntax Trees (ASTs)',
		body: 'Explore the hierarchical structure that represents your code&apos;s relationships and components. ASTs can even be used to create your own code analysis tools.',
		image: 'logo-asts.svg',
	},
	{
		title: 'JavaScript Engine and Runtime',
		body: 'Peek behind the curtain at how your code is compiled, optimized, and executed in the browser and V8 engines.',
		image: 'logo-js-engine-and-runtime.svg',
	},
	{
		title: 'Execution Context and Environments',
		body: 'Demystify variable scope, hoisting, and the execution stack by learning how JavaScript manages context and environments. Predict and control your code&apos;s behavior with confidence.',
		image: 'logo-execution-context.svg',
	},
	{
		title: 'Closures and Scopes',
		body: 'Learn how closures reference the lexical environments in your code, and understand that hoisting isn&apos;t just moving variables to the top of your file.',
		image: 'logo-closures-and-scopes.svg',
	},
	{
		title: 'Memory Management',
		body: 'Take control of memory usage through garbage collection and allocation strategies. Prevent leaks and optimize resource consumption for peak application performance.',
		image: 'logo-memory-management.svg',
	},
	{
		title: 'Event Loop',
		body: 'Unravel the mysteries the event loop, call stack, and the task & microtask queues. Everything in JavaScript revolves around the event loop.',
		image: 'logo-event-loop.svg',
	},
	{
		title: 'Promises',
		body: 'Gain a deeper understanding of what really goes on with asynchronous code in JavaScript. Learn how to create, consume, and chain promises to manage complex workflows, and what makes async/await tick.',
		image: 'logo-promises.svg',
	},
	{
		title: 'Prototypes',
		body: 'Grasp the relationship between classes and prototypes, including how inheritance works in JavaScript. ',
		image: 'logo-protopypes.svg',
	},
	{
		title: 'Generators',
		body: 'Control function execution, manage data streams, and simplify complex workflows with the power of generators. Learn how to pause and resume functions at will.',
		image: 'logo-generators.svg',
	},
	{
		title: 'Modules',
		body: 'Compare and contrast CommonJS, AMD, UMD, and ESM modules and their impact on your codebase. Organize your code while supporting async imports, tree shaking, and static analysis. ',
		image: 'logo-modules.svg',
	},
]
