'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'

import { cn } from '@coursebuilder/utils-ui/cn'

type Post = {
	id: string
	fields: {
		slug: string
		title: string
		description?: string | null
	}
}

/**
 * Directional hover list that shows an animated background
 * following the hovered item with smooth motion transitions.
 */
export function DirectionalHoverList({
	posts,
	className,
}: {
	posts: Post[]
	className?: string
}) {
	const [hoveredId, setHoveredId] = useState<string | null>(null)

	return (
		<ul className={cn('divide-border flex flex-col', className)}>
			{posts.map((post, i) => (
				<li
					key={post.id}
					className="group relative"
					onMouseEnter={() => setHoveredId(post.id)}
					onMouseLeave={() => setHoveredId(null)}
				>
					{hoveredId === post.id && (
						<motion.div
							layoutId="hover-bg"
							className="bg-muted absolute inset-0 -mx-4 rounded-md shadow-inner"
							initial={false}
							transition={{
								type: 'spring',
								stiffness: 500,
								damping: 35,
							}}
						/>
					)}
					<Link
						prefetch
						href={`/${post.fields.slug}`}
						className={cn(
							'relative z-10 block py-5',
							// hoveredId === post.id && 'text-primary-foreground',
						)}
					>
						<span className="font-heading text-primary text-2xl font-semibold sm:text-2xl">
							{post.fields.title}
						</span>
						{post.fields.description && (
							<p
								className={cn(
									'font-sans text-base opacity-80',
									hoveredId === post.id ? 'opacity-90' : 'opacity-80',
								)}
							>
								{post.fields.description}
							</p>
						)}
					</Link>
					<div className="bg-border relative z-10 -mx-4 h-px w-full" />
				</li>
			))}
		</ul>
	)
}
