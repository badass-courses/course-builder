import * as React from 'react'
import SectionWrapper from '@/components/section-wrapper'
import { cn } from '@/utils/cn'
import { MDXProvider, useMDXComponents } from '@mdx-js/react'

const QuestionAndAnswer: React.FC<
	React.PropsWithChildren<{ className?: string }>
> = ({ children, className }) => {
	const mdxComponents = useMDXComponents()
	const childrenArray = React.Children.toArray(children)
	const title = childrenArray[0]
	const content = childrenArray.slice(1)

	return (
		<MDXProvider components={mdxComponents}>
			<SectionWrapper
				className={cn(
					'sm:bg-jsv-charcoal grid gap-3 rounded-none bg-transparent p-0 sm:rounded-[2.5rem] sm:p-14 md:gap-5 md:p-16 lg:grid-cols-2 lg:p-20 xl:p-24',
					className,
				)}
			>
				<div className="prose-headings:my-0 prose-headings:font-normal prose-headings:text-[1.75rem] sm:prose-headings:text-3xl md:prose-headings:text-[2.5rem] prose-headings:leading-[1.4] sm:prose-headings:leading-[1.2]">
					{title}
				</div>
				<div className="prose prose-lg md:prose-xl prose-p:first-of-type:mt-0 prose-p:last-of-type:mb-0">
					{content}
				</div>
			</SectionWrapper>
		</MDXProvider>
	)
}

export default QuestionAndAnswer
