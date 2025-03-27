'use client'

import Link from 'next/link'
import { track } from '@/utils/analytics'
import type { MDXComponents } from 'mdx/types'

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
