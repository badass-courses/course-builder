'use client'

import * as React from 'react'

const CHARS = '░█'

function randomChar() {
	return CHARS[Math.floor(Math.random() * CHARS.length)]!
}

export type ScrambleTextHandle = {
	trigger: () => void
}

export function ScrambleText({
	text,
	className,
	ref,
	scrambleSpeed = 30,
	revealDelay = 60,
	initialRevealDelay = 20,
}: {
	text: string
	className?: string
	ref?: React.Ref<ScrambleTextHandle>
	scrambleSpeed?: number
	revealDelay?: number
	initialRevealDelay?: number
}) {
	const [displayed, setDisplayed] = React.useState<string[]>(text.split(''))
	const [revealed, setRevealed] = React.useState<boolean[]>(
		new Array(text.length).fill(true),
	)
	const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null)
	const timeoutsRef = React.useRef<ReturnType<typeof setTimeout>[]>([])

	const runScramble = React.useCallback(
		(delay: number) => {
			setRevealed(new Array(text.length).fill(false))
			setDisplayed(Array.from({ length: text.length }, () => randomChar()))

			if (intervalRef.current) clearInterval(intervalRef.current)
			timeoutsRef.current.forEach(clearTimeout)
			timeoutsRef.current = []

			intervalRef.current = setInterval(() => {
				setDisplayed((prev) =>
					prev.map((ch, i) => (ch === text[i] ? text[i]! : randomChar())),
				)
			}, scrambleSpeed)

			for (let i = 0; i < text.length; i++) {
				const timeout = setTimeout(
					() => {
						setRevealed((prev) => {
							const next = [...prev]
							next[i] = true
							return next
						})
						setDisplayed((prev) => {
							const next = [...prev]
							next[i] = text[i]!
							return next
						})
						if (i === text.length - 1 && intervalRef.current) {
							clearInterval(intervalRef.current)
						}
					},
					delay * (i + 1),
				)
				timeoutsRef.current.push(timeout)
			}
		},
		[text, scrambleSpeed],
	)

	React.useEffect(() => {
		runScramble(initialRevealDelay)
		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current)
			timeoutsRef.current.forEach(clearTimeout)
		}
	}, []) // eslint-disable-line react-hooks/exhaustive-deps

	React.useImperativeHandle(
		ref,
		() => ({
			trigger: () => runScramble(revealDelay),
		}),
		[runScramble, revealDelay],
	)

	return (
		<span className={className}>
			{displayed.map((ch, i) => (
				<span
					key={i}
					className={revealed[i] ? undefined : 'opacity-70'}
					aria-hidden="true"
				>
					{ch}
				</span>
			))}
			<span className="sr-only">{text}</span>
		</span>
	)
}
