import React from 'react'
import { MDXProvider, useMDXComponents } from '@mdx-js/react'

const QuestionAndAnswer: React.FC<React.PropsWithChildren> = ({ children }) => {
	const mdxComponents = useMDXComponents()
	const childrenArray = React.Children.toArray(children)
	const title = childrenArray[0]
	const content = childrenArray.slice(1)

	return (
		<MDXProvider components={mdxComponents}>
			<div className="bg-card grid grid-cols-2 gap-5 rounded-[2.5rem] p-24">
				<div className="prose-headings:mt-0 prose-headings:font-normal prose-headings:text-[2.5rem] prose-headings:leading-[1.2] text-[2.5rem]">
					{title}
				</div>
				<div className="prose sm:prose-xl dark:prose-invert prose-p:first-of-type:mt-0">
					{content}
				</div>
			</div>
		</MDXProvider>
	)
}

export default QuestionAndAnswer
