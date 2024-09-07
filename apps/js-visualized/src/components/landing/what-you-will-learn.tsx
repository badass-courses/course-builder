import * as React from 'react'
import Image from 'next/image'
import SectionWrapper from '@/components/section-wrapper'
import { cn } from '@/utils/cn'

const urlBase = '/images/logos/'

const WhatYouWillLearn: React.FC<{ className?: string }> = ({ className }) => {
	return (
		<div className={cn('not-prose', className)}>
			<h3 className="max-w-[350px] text-center text-lg font-bold text-white sm:max-w-none sm:text-2xl">
				Here's a closer look at what you'll learn:
			</h3>
			<SectionWrapper className="sm:bg-jsv-charcoal mt-9 rounded-none bg-transparent p-0 sm:mt-20 sm:rounded-[2.5rem] sm:p-8 md:p-10 lg:p-24">
				<ul className="border-jsv-hazy-charcoal list-none border-b sm:border-none">
					{copy.map((copy) => {
						return (
							<li
								key={copy.title}
								className="border-jsv-hazy-charcoal ms:gap-14 flex flex-col items-center gap-5 text-balance border-t py-10 text-center first:border-none first:pt-0 sm:gap-6 md:flex-row md:gap-10 md:py-12 md:text-left lg:gap-12 lg:py-[74px]"
							>
								<div className="w-24 shrink-0 sm:w-28 md:w-40 lg:w-48">
									<Image
										src={`${urlBase}${copy.image}`}
										alt={copy.title}
										width={200}
										height={200}
									/>
								</div>
								<div className="max-w-[660px] space-y-4">
									<h3 className="text-lg font-bold leading-tight text-white sm:text-xl md:text-2xl">
										{copy.title}
									</h3>
									<p className="text-body-text-alt text-lg leading-normal sm:leading-[1.75]">
										{copy.body}
									</p>
								</div>
							</li>
						)
					})}
				</ul>
			</SectionWrapper>
		</div>
	)
}

export default WhatYouWillLearn

const copy = [
	{
		title: 'Parsing and Lexing',
		body: "Dive deep into the world of code interpretation and uncover how JavaScript breaks down and understands your scripts. By learning about tokens and syntax errors, you'll lay a strong foundation for writing cleaner, error-free code.",
		image: 'logo-parsing-and-lexing.svg',
	},
	{
		title: 'Abstract Syntax Trees (ASTs)',
		body: "Explore the hierarchical structure that represents your code's relationships and components. ASTs can even be used to create your own code analysis tools.",
		image: 'logo-asts.svg',
	},
	{
		title: 'JavaScript Engine and Runtime',
		body: 'Peek behind the curtain at how your code is compiled, optimized, and executed in the browser and V8 engines.',
		image: 'logo-js-engine-and-runtime.svg',
	},
	{
		title: 'Execution Context and Environments',
		body: "Demystify variable scope, hoisting, and the execution stack by learning how JavaScript manages context and environments. Predict and control your code's behavior with confidence.",
		image: 'logo-execution-context.svg',
	},
	{
		title: 'Closures and Scopes',
		body: "Learn how closures reference the lexical environments in your code, and understand that hoisting isn't just moving variables to the top of your file.",
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
