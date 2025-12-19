'use client'

import {
	forwardRef,
	useEffect,
	useMemo,
	useRef,
	useState,
	type CSSProperties,
	type HTMLAttributes,
	type ReactNode,
} from 'react'
import {
	animate,
	motion,
	useAnimationFrame,
	useInView,
	useMotionValue,
	useReducedMotion,
	useTransform,
	type MotionValue,
} from 'motion/react'

/**
 * Configuration options for the Ticker component
 */
interface TickerProps
	extends Omit<
		HTMLAttributes<HTMLDivElement>,
		| 'children'
		| 'onDrag'
		| 'onDragEnd'
		| 'onDragStart'
		| 'onAnimationStart'
		| 'onAnimationEnd'
	> {
	/** Array of React elements to display in the ticker */
	items: ReactNode[]
	/** Scroll velocity in pixels per second (default: 50) */
	velocity?: number
	/** Factor to multiply velocity by on hover (default: 0.5, set to 1 to disable) */
	hoverFactor?: number
	/** Gap between items in pixels (default: 10) */
	gap?: number
	/** External motion value to control offset position */
	offset?: MotionValue<number>
	/** Axis of scroll - 'x' for horizontal, 'y' for vertical (default: 'x') */
	axis?: 'x' | 'y'
	/** Additional children to render (outside ticker items) */
	children?: ReactNode
}

/**
 * Wraps offset value to create infinite loop effect
 */
function wrap(min: number, max: number, value: number): number {
	const range = max - min
	if (range === 0) return min
	return ((((value - min) % range) + range) % range) + min
}

/**
 * A performant, infinitely scrolling ticker/marquee component.
 * Supports external offset control, auto-scroll, and hover interactions.
 */
const Ticker = forwardRef<HTMLDivElement, TickerProps>(function TickerComponent(
	{
		items,
		velocity = 50,
		hoverFactor = 0.5,
		gap = 10,
		axis = 'x',
		offset: externalOffset,
		children,
		style,
		...props
	},
	ref,
) {
	const containerRef = useRef<HTMLDivElement>(null)
	const listRef = useRef<HTMLUListElement>(null)
	const [containerLength, setContainerLength] = useState(0)
	const [singleItemWidth, setSingleItemWidth] = useState(0)

	const velocityFactor = useMotionValue(1)
	const internalOffset = useMotionValue(0)
	const offset = externalOffset ?? internalOffset

	const isInView = useInView(containerRef, { margin: '100px' })
	const isReducedMotion = useReducedMotion()

	// Calculate how many copies we need to fill the container + extra for seamless loop
	const repeatCount = useMemo(() => {
		if (singleItemWidth === 0 || containerLength === 0) return 3
		// Need enough to fill viewport + one extra set for seamless wrapping
		return Math.ceil(containerLength / (singleItemWidth + gap)) + 2
	}, [containerLength, singleItemWidth, gap])

	// Total width of one complete set of items
	const totalWidth = singleItemWidth + gap

	// Wrap offset for infinite loop effect
	const wrappedOffset = useTransform(() => {
		if (totalWidth === 0) return 0
		return wrap(-totalWidth, 0, offset.get())
	})

	// Measure container and items
	useEffect(() => {
		const container = containerRef.current
		const list = listRef.current
		if (!container || !list) return

		const measure = () => {
			const lengthProp = axis === 'x' ? 'offsetWidth' : 'offsetHeight'
			setContainerLength(container[lengthProp])

			// Measure just the first item group to get single item width
			const firstItem = list.querySelector('.ticker-item') as HTMLElement
			if (firstItem) {
				setSingleItemWidth(firstItem[lengthProp])
			}
		}

		measure()

		const resizeObserver = new ResizeObserver(measure)
		resizeObserver.observe(container)

		return () => resizeObserver.disconnect()
	}, [axis, items])

	// Auto-scroll animation (only when no external offset provided)
	useAnimationFrame(
		!externalOffset && isInView && !isReducedMotion
			? (_, delta) => {
					const frameOffset =
						(delta / 1000) * (velocity * -1 * velocityFactor.get())
					offset.set(offset.get() + frameOffset)
				}
			: () => {},
	)

	// Assign ref
	useEffect(() => {
		if (typeof ref === 'function') {
			ref(containerRef.current)
		} else if (ref) {
			ref.current = containerRef.current
		}
	}, [ref])

	// Create repeated items
	const repeatedItems = useMemo(() => {
		const result: ReactNode[] = []
		for (let i = 0; i < repeatCount; i++) {
			items.forEach((item, itemIndex) => {
				result.push(
					<li
						key={`${i}-${itemIndex}`}
						className="ticker-item"
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							flexShrink: 0,
						}}
					>
						{item}
					</li>,
				)
			})
		}
		return result
	}, [items, repeatCount])

	const containerStyle: CSSProperties = {
		display: 'flex',
		position: 'relative',
		overflow: 'clip',
		width: '100%',
		...style,
	}

	const listStyle: CSSProperties = {
		display: 'flex',
		position: 'relative',
		flexDirection: axis === 'x' ? 'row' : 'column',
		gap: `${gap}px`,
		listStyleType: 'none',
		padding: 0,
		margin: 0,
		willChange: isInView ? 'transform' : undefined,
	}

	return (
		<>
			<motion.div
				{...props}
				ref={containerRef}
				style={containerStyle}
				onPointerEnter={() => {
					animate(velocityFactor, hoverFactor)
				}}
				onPointerLeave={() => {
					animate(velocityFactor, 1)
				}}
			>
				<motion.ul
					ref={listRef}
					role="group"
					style={{
						...listStyle,
						x: axis === 'x' ? wrappedOffset : 0,
						y: axis === 'y' ? wrappedOffset : 0,
					}}
				>
					{repeatedItems}
				</motion.ul>
			</motion.div>
			{children}
		</>
	)
})

export { Ticker }
export type { TickerProps }
