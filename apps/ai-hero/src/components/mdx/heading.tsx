'use client'

import { Children, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
	useActiveHeadingContext,
	type HeadingInfo,
} from '@/hooks/use-active-heading'
import { slugifyHeading } from '@/utils/extract-markdown-headings'
import slugify from '@sindresorhus/slugify'
import { motion, useInView } from 'framer-motion'

interface HeadingProps {
	level: 1 | 2 | 3 | 4 | 5 | 6
	children: React.ReactNode
	className?: string
}

/**
 * Custom heading component that tracks viewport visibility and updates active heading context
 */
export function Heading({ level, children, ...props }: HeadingProps) {
	const ref = useRef<HTMLHeadingElement>(null)
	const isInView = useInView(ref, { amount: 0.5, margin: '0px 0px -50% 0px' })
	const { setActiveHeading, activeHeading } = useActiveHeadingContext()

	const text = Children.toArray(children)
		.map((child) => (typeof child === 'string' ? child : ''))
		.join('')
	const slug = slugifyHeading(text)

	useEffect(() => {
		if (isInView) {
			const headingInfo: HeadingInfo = {
				slug,
				text,
				level,
			}
			setActiveHeading(headingInfo)
		}
	}, [isInView, slug, text, level, setActiveHeading])

	const Component = motion[`h${level}`]

	return (
		<Component ref={ref} id={slug} className="scroll-mt-32">
			<Link href={`#${slug}`} className="!text-inherit no-underline">
				{children}
			</Link>
		</Component>
	)
}
