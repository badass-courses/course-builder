'use client'

import { useEffect, useRef, type ElementType } from 'react'
import { animate, stagger } from 'motion'
import { splitText } from 'motion-plus'

import { cn } from '@coursebuilder/utils-ui/cn'

type SplitTextProps<T extends ElementType = 'span'> = {
	/** The HTML element to render (h1, h2, p, span, etc.) */
	as?: T
	children: React.ReactNode
	className?: string
}

/**
 * Animated split text component that reveals words with a spring animation.
 * Uses motion-plus for text splitting and motion for animations.
 * Supports inline elements like <br /> for line breaks.
 *
 * @example
 * <SplitText as="h1" className="text-4xl">
 *   First line<br />Second line
 * </SplitText>
 */
export function SplitText<T extends ElementType = 'span'>({
	as,
	children,
	className,
}: SplitTextProps<T>) {
	const textRef = useRef<HTMLElement>(null)

	useEffect(() => {
		document.fonts.ready.then(() => {
			if (!textRef.current) return

			// Show the element once fonts are loaded
			textRef.current.style.visibility = 'visible'

			const { words } = splitText(textRef.current)

			animate(
				words,
				{ opacity: [0, 1], y: [10, 0], filter: ['blur(4px)', 'blur(0px)'] },
				{
					type: 'spring',
					duration: 2,
					bounce: 0,
					delay: stagger(0.05),
				},
			)
		})
	}, [children])

	const Tag = as || 'span'

	return (
		<Tag
			ref={textRef}
			className={cn(
				'invisible [&_.split-word]:will-change-[transform,opacity,filter]',
				className,
			)}
		>
			{children}
		</Tag>
	)
}

export default SplitText
