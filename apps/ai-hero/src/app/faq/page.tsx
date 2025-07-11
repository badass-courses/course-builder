import type { Metadata } from 'next'
import LayoutClient from '@/components/layout-client'
import { env } from '@/env.mjs'
import { getPage } from '@/lib/pages-query'
import { formatFaq } from '@/utils/format-faq'

import { Accordion } from '@coursebuilder/ui'

import { FaqItem } from './_components/faq-item'

export const metadata: Metadata = {
	title: 'FAQ | AI Hero',
	description: 'Frequently Asked Questions',
}

export default async function FaqPage() {
	const page = await getPage('faq-2ryr6')
	const formattedQuestions = formatFaq(page?.fields?.body || '')

	return (
		<LayoutClient withContainer>
			<main className="flex min-h-[calc(100vh-var(--nav-height))] grow flex-col pb-16">
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
									<FaqItem question={question} answer={answer} key={question} />
								),
							)}
						</ul>
					</Accordion>
				</div>
				<h2 className="mx-auto max-w-sm text-balance text-center font-normal opacity-80 sm:text-lg lg:text-xl">
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
