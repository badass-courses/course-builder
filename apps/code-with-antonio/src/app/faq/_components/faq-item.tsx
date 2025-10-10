'use client'

import Markdown from 'react-markdown'

import {
	AccordionContent,
	AccordionHeader,
	AccordionItem,
	AccordionTrigger,
} from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

export const FaqItem: React.FC<{
	question: string
	answer: string
	className?: string
}> = ({ question, answer, className }) => {
	return (
		<li>
			<AccordionItem
				value={question}
				className={cn(
					'rounded-md border border-gray-200/50 bg-white transition dark:border-white/5 dark:bg-white/5 dark:shadow-none dark:hover:bg-white/10',
					className,
				)}
			>
				<AccordionTrigger className="**:data-chevron:text-foreground hover:bg-foreground/5 flex w-full items-center justify-between px-3 py-3 text-left text-base font-medium hover:no-underline sm:px-5 sm:py-3 sm:text-lg">
					{question}
				</AccordionTrigger>
				<AccordionContent className="pb-0">
					<Markdown
						data-markdown=""
						components={{
							a: (props) => <a {...props} target="_blank" />,
						}}
						className="prose dark:prose-invert [&_a]:text-primary max-w-none px-5 pb-5 [&_a]:underline [&_p+p]:mt-2"
					>
						{answer}
					</Markdown>
				</AccordionContent>
			</AccordionItem>
		</li>
	)
}
