'use client'

import { useEffect, useRef, type ElementType } from 'react'
import { animate, stagger } from 'motion'
import { invariant } from 'motion-utils'

import { cn } from '@coursebuilder/utils-ui/cn'

type SplitTextOptions = {
	charClass?: string
	wordClass?: string
	lineClass?: string
}

type SplitResult = {
	chars: HTMLSpanElement[]
	words: HTMLSpanElement[]
	lines: HTMLSpanElement[]
}

/**
 * Splits text content of an element into characters, words, and lines.
 * Each segment is wrapped in a span for individual animation control.
 */
function splitText(
	element: HTMLElement,
	{
		charClass = 'split-char',
		wordClass = 'split-word',
		lineClass = 'split-line',
	}: SplitTextOptions = {},
): SplitResult {
	invariant(Boolean(element), 'Element not found')

	const text = element.textContent || ''
	element.setAttribute('aria-label', text)
	element.textContent = ''

	const result: SplitResult = { chars: [], words: [], lines: [] }
	const words = text.split(' ')
	const wordElements: HTMLSpanElement[] = []
	const spacerElements: (Text | null)[] = []

	// Create word and character spans
	for (const [wordIndex, word] of words.entries()) {
		const wordSpan = document.createElement('span')
		wordSpan.className = wordClass
		wordSpan.dataset.index = wordIndex.toString()
		wordSpan.style.display = 'inline-block'

		result.words.push(wordSpan)
		wordElements.push(wordSpan)

		// Create character spans
		for (const [charIndex, char] of [...word].entries()) {
			const charSpan = document.createElement('span')
			charSpan.className = charClass
			charSpan.dataset.index = charIndex.toString()
			charSpan.style.display = 'inline-block'
			charSpan.textContent = char
			wordSpan.appendChild(charSpan)
			result.chars.push(charSpan)
		}

		element.appendChild(wordSpan)

		// Add space between words
		if (wordIndex < words.length - 1) {
			const spaceNode = document.createTextNode(' ')
			element.appendChild(spaceNode)
			spacerElements.push(spaceNode)
		} else {
			spacerElements.push(null)
		}
	}

	// Measure top offsets to determine lines
	const wordData = wordElements.map((wordSpan, index) => ({
		element: wordSpan,
		top: wordSpan.offsetTop,
		spacer: spacerElements[index] ?? null,
	}))

	// Group words into lines
	const lines: { elements: (HTMLSpanElement | Text)[] }[] = []
	let currentLine: (HTMLSpanElement | Text)[] = []
	let currentTop = wordData[0]?.top ?? 0

	for (const { element: wordEl, top, spacer } of wordData) {
		if (top > currentTop && currentLine.length > 0) {
			lines.push({ elements: currentLine })
			currentLine = []
			currentTop = top
		}
		currentLine.push(wordEl)
		if (spacer) currentLine.push(spacer)
	}
	if (currentLine.length > 0) {
		lines.push({ elements: currentLine })
	}

	// Rebuild with line wrappers
	element.textContent = ''
	for (const [lineIndex, line] of lines.entries()) {
		const lineSpan = document.createElement('span')
		lineSpan.className = lineClass
		lineSpan.dataset.index = lineIndex.toString()
		lineSpan.style.display = 'inline-block'
		result.lines.push(lineSpan)

		for (const node of line.elements) {
			lineSpan.appendChild(node)
		}
		element.appendChild(lineSpan)
	}

	return result
}

type SplitTextProps<T extends ElementType = 'span'> = {
	/** The HTML element to render (h1, h2, p, span, etc.) */
	as?: T
	children: React.ReactNode
	className?: string
	/** Split type: 'chars', 'words', or 'lines' */
	splitBy?: 'chars' | 'words' | 'lines'
	/** Animation speed multiplier (default: 1). Higher = faster */
	speed?: number
}

/**
 * Animated split text component that reveals words with a spring animation.
 * Splits text into words/chars/lines for individual animation control.
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
	splitBy = 'words',
	speed = 1,
}: SplitTextProps<T>) {
	const textRef = useRef<HTMLElement>(null)

	useEffect(() => {
		document.fonts.ready.then(() => {
			if (!textRef.current) return

			textRef.current.style.visibility = 'visible'

			const { chars, words, lines } = splitText(textRef.current)

			const elements =
				splitBy === 'chars' ? chars : splitBy === 'words' ? words : lines
			const baseDuration = 2 / speed
			const baseStagger = 0.05 / speed

			animate(
				elements,
				{ opacity: [0, 1], y: [10, 0], filter: ['blur(4px)', 'blur(0px)'] },
				{
					type: 'spring',
					duration: baseDuration,
					bounce: 0,
					delay: stagger(baseStagger),
				},
			)
		})
	}, [children, splitBy, speed])

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
