import React from 'react'
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
			<SectionWrapper className={cn('grid grid-cols-2 gap-5', className)}>
				<div className="prose-headings:mt-0 prose-headings:font-normal prose-headings:text-[2.5rem] prose-headings:leading-[1.2] text-[2.5rem]">
					{title}
				</div>
				<div className="prose sm:prose-xl dark:prose-invert prose-p:first-of-type:mt-0">
					{content}
				</div>
			</SectionWrapper>
		</MDXProvider>
	)
}

export default QuestionAndAnswer
