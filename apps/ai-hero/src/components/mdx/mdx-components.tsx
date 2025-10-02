'use client'

import { createContext, useContext, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
	useActiveHeadingContext,
	type HeadingInfo,
} from '@/hooks/use-active-heading'
import { track } from '@/utils/analytics'
import { slugifyHeading } from '@/utils/extract-markdown-headings'
import { useInView } from 'framer-motion'
import { ExternalLink } from 'lucide-react'
import type { MDXComponents } from 'mdx/types'

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@coursebuilder/ui'

import { Heading } from './heading'

export const mdxComponents: MDXComponents = {
	h1: (props) => <Heading level={1} {...props} />,
	h2: (props) => <Heading level={2} {...props} />,
	h3: (props) => <Heading level={3} {...props} />,
	h4: (props) => <Heading level={4} {...props} />,
	h5: (props) => <Heading level={5} {...props} />,
	h6: (props) => <Heading level={6} {...props} />,
}

export const TrackLink = ({
	children,
	title,
	...props
}: { children: React.ReactNode; title?: string } & React.ComponentProps<
	typeof Link
>) => {
	return (
		<Link
			onClick={() => {
				track('clicked_link', {
					link_text: title ? title : children,
				})
			}}
			{...props}
		>
			{children}
		</Link>
	)
}

// Context to let child components know they're within AISummary
export const AISummaryContext = createContext(false)

export const AISummary = ({
	children,
	title,
	href,
}: {
	children: React.ReactNode
	title?: string
	href: string
}) => {
	const ref = useRef<HTMLDivElement>(null)
	const isInView = useInView(ref, { amount: 0.5, margin: '0px 0px -50% 0px' })
	const { setActiveHeading } = useActiveHeadingContext()
	const displayTitle = title || href

	useEffect(() => {
		if (isInView) {
			const headingInfo: HeadingInfo = {
				slug: slugifyHeading(displayTitle),
				text: displayTitle,
				level: 2, // You can adjust this level as needed
			}
			setActiveHeading(headingInfo)
		}
	}, [isInView, displayTitle, setActiveHeading])

	return (
		<AISummaryContext.Provider value={true}>
			<div ref={ref}>
				<Accordion type="single" collapsible>
					<AccordionItem
						title="AI Summary"
						value="ai-summary"
						className="dark:bg-card bg-muted/30 border-border flex w-full flex-col rounded-xl border"
					>
						<div className="flex items-center">
							<AccordionTrigger
								id={slugifyHeading(displayTitle)}
								className="w-full border-r px-5 py-5 text-left font-semibold leading-tight transition dark:hover:brightness-125"
							>
								<div className="">
									<span className="text-muted-foreground inline-flex items-center gap-1">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 16 16"
											aria-hidden="true"
											className="text-primary mr-1 size-4"
										>
											<g fill="currentColor">
												<path
													d="M13,6a.75.75,0,0,1-.75-.75,1.5,1.5,0,0,0-1.5-1.5.75.75,0,0,1,0-1.5,1.5,1.5,0,0,0,1.5-1.5.75.75,0,0,1,1.5,0,1.5,1.5,0,0,0,1.5,1.5.75.75,0,0,1,0,1.5,1.5,1.5,0,0,0-1.5,1.5A.75.75,0,0,1,13,6Z"
													fill="currentColor"
												/>
												<path
													d="M6,16a1,1,0,0,1-1-1,4,4,0,0,0-4-4A1,1,0,0,1,1,9,4,4,0,0,0,5,5,1,1,0,0,1,7,5a4,4,0,0,0,4,4,1,1,0,0,1,0,2,4,4,0,0,0-4,4A1,1,0,0,1,6,16Z"
													fill="currentColor"
												/>
											</g>
										</svg>{' '}
										AI Summary:
									</span>{' '}
									{displayTitle}
								</div>
							</AccordionTrigger>
							<TrackLink
								className="text-foreground/80 dark:text-foreground/60 not-prose hover:text-foreground dark:hover:text-foreground inline-flex shrink-0 items-center gap-1.5 px-5 text-sm font-normal no-underline transition sm:text-base"
								title={displayTitle}
								target="_blank"
								href={href}
							>
								Original <ExternalLink className="size-4" />
							</TrackLink>
						</div>
						<AccordionContent className="radix-state-open:border-t px-5 pt-8">
							<div className="prose dark:prose-invert sm:prose-lg lg:prose-xl max-w-4xl">
								{children}
							</div>
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			</div>
		</AISummaryContext.Provider>
	)
}
