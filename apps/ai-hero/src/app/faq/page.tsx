import type { Metadata } from 'next'
import LayoutClient from '@/components/layout-client'
import { env } from '@/env.mjs'
import { getPage } from '@/lib/pages-query'
import { formatFaq } from '@/utils/format-faq'
import Markdown from 'react-markdown'

import {
	Accordion,
	AccordionContent,
	AccordionHeader,
	AccordionItem,
	AccordionTrigger,
} from '@coursebuilder/ui'

export const metadata: Metadata = {
	title: 'FAQ | AI Hero',
	description: 'Frequently Asked Questions',
}

export default async function FaqPage() {
	const page = await getPage('faq-2ryr6')
	const formattedQuestions = formatFaq(page?.fields?.body || '')

	return (
		<LayoutClient withContainer>
			<main className="flex min-h-[calc(100vh-var(--nav-height))] flex-grow flex-col pb-16">
				<div className="flex w-full flex-col items-center px-3 py-16 sm:px-10">
					<h1 className="mb-16 text-center text-6xl font-bold">
						{page?.fields?.title}
					</h1>
					<Accordion type="multiple" className="flex w-full flex-col">
						<ul className="flex flex-col gap-3">
							{formattedQuestions.map(
								({
									question,
									answer,
								}: {
									question: string
									answer: string
								}) => (
									<Question
										question={question}
										answer={answer}
										key={question}
									/>
								),
							)}
						</ul>
					</Accordion>
				</div>
				<h2 className="mx-auto  max-w-sm text-balance text-center font-normal opacity-80 sm:text-lg lg:text-xl">
					If you have any more questions, please contact us at{' '}
					<a
						href={`mailto:${env.NEXT_PUBLIC_SUPPORT_EMAIL}`}
						className="text-primary font-bold underline"
					>
						{env.NEXT_PUBLIC_SUPPORT_EMAIL}
					</a>
				</h2>
			</main>
		</LayoutClient>
	)
}

const Question: React.FC<{ question: string; answer: string }> = ({
	question,
	answer,
}) => {
	return (
		<li>
			<AccordionItem
				value={question}
				className="rounded-md border border-gray-200/50 bg-white shadow-xl shadow-gray-500/5 transition dark:border-white/5 dark:bg-white/5 dark:shadow-none dark:hover:bg-white/10"
			>
				<AccordionHeader className="">
					<AccordionTrigger className="[&_[data-chevron]]:text-foreground px-3 py-3 text-left text-base font-semibold sm:px-5 sm:py-3 sm:text-lg">
						{question}
					</AccordionTrigger>
				</AccordionHeader>
				<AccordionContent>
					<Markdown
						components={{
							a: (props) => <a {...props} target="_blank" />,
						}}
						className="prose dark:prose-invert max-w-none px-5 pb-5"
					>
						{answer}
					</Markdown>
				</AccordionContent>
			</AccordionItem>
		</li>
	)
}
