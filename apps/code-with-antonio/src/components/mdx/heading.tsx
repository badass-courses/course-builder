'use client'

import { Children, useContext, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import {
	ActiveHeadingContext,
	type HeadingInfo,
} from '@/hooks/use-active-heading'
import { slugifyHeading } from '@/utils/extract-markdown-headings'
import { motion, useInView } from 'framer-motion'

import { AISummaryContext } from './mdx-components'

interface HeadingProps {
	level: 1 | 2 | 3 | 4 | 5 | 6
	children: React.ReactNode
	className?: string
}

/**
 * Custom heading component that tracks viewport visibility and updates active heading context
 * Will not track headings that are within an AISummary component
 * Gracefully falls back to normal heading behavior when not wrapped in ActiveHeadingProvider
 */
export function Heading({ level, children, ...props }: HeadingProps) {
	const ref = useRef<HTMLHeadingElement>(null)
	const isInView = useInView(ref, { amount: 0.5, margin: '0px 0px -50% 0px' })
	const activeHeadingContext = useContext(ActiveHeadingContext)
	const isWithinAISummary = useContext(AISummaryContext)

	const text = useMemo(
		() =>
			Children.toArray(children)
				.map((child) => (typeof child === 'string' ? child : ''))
				.join(''),
		[children],
	)

	const slug = useMemo(() => slugifyHeading(text), [text])

	const headingInfo = useMemo(
		(): HeadingInfo => ({
			slug,
			text,
			level,
		}),
		[slug, text, level],
	)

	useEffect(() => {
		if (
			isInView &&
			!isWithinAISummary &&
			activeHeadingContext?.setActiveHeading
		) {
			activeHeadingContext.setActiveHeading(headingInfo)
		}
	}, [isInView, headingInfo, activeHeadingContext, isWithinAISummary])

	const Component = motion[`h${level}`]

	return (
		<Component ref={ref} id={slug} className="scroll-mt-16">
			<Link
				href={`#${slug}`}
				className="text-inherit! w-full font-semibold no-underline"
			>
				{children}
			</Link>
		</Component>
	)
}
