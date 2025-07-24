'use client'

import { Children, useContext, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
	useActiveHeadingContext,
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
 */
export function Heading({ level, children, ...props }: HeadingProps) {
	const ref = useRef<HTMLHeadingElement>(null)
	const isInView = useInView(ref, { amount: 0.5, margin: '0px 0px -50% 0px' })
	const { setActiveHeading } = useActiveHeadingContext()
	const isWithinAISummary = useContext(AISummaryContext)

	const text = Children.toArray(children)
		.map((child) => (typeof child === 'string' ? child : ''))
		.join('')
	const slug = slugifyHeading(text)

	useEffect(() => {
		if (isInView && !isWithinAISummary) {
			const headingInfo: HeadingInfo = {
				slug,
				text,
				level,
			}
			setActiveHeading(headingInfo)
		}
	}, [isInView, slug, text, level, setActiveHeading, isWithinAISummary])

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
