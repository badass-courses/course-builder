import { useEffect, useRef } from 'react'

/**
 * Hook to auto-scroll to active resource on mount and when slug changes
 * Maintains scroll position to active lesson when navigating between resources
 */
export function useScrollToActive(currentLessonSlug?: string) {
	const scrollAreaRef = useRef<HTMLDivElement | null>(null)
	const lastSlugRef = useRef<string | undefined>(undefined)
	const hasMountedRef = useRef(false)

	useEffect(() => {
		// On initial mount, always scroll (if slug provided)
		// After that, scroll when slug changes
		const isInitialMount = !hasMountedRef.current
		hasMountedRef.current = true

		// Skip if slug hasn't changed (and not initial mount)
		if (!isInitialMount && currentLessonSlug === lastSlugRef.current) {
			console.debug('[useScrollToActive] Slug unchanged, skipping', {
				current: currentLessonSlug,
				last: lastSlugRef.current,
			})
			return
		}

		console.debug('[useScrollToActive] Slug changed or initial mount', {
			current: currentLessonSlug,
			last: lastSlugRef.current,
			isInitialMount,
		})

		// Skip if no active lesson
		if (!currentLessonSlug) {
			console.debug('[useScrollToActive] No lesson slug provided')
			return
		}

		// Store slug in local variable to track it through async operations
		const slugToScrollTo = currentLessonSlug

		// Mark this slug as processed AFTER scroll completes
		// Don't set it here, or React's double-invoke will skip the scroll

		console.debug('[useScrollToActive] Starting scroll to', slugToScrollTo)

		const scrollAreaRoot = scrollAreaRef.current
		if (!scrollAreaRoot) {
			console.debug('[useScrollToActive] No scrollAreaRoot found')
			return
		}

		// Find the actual scrollable viewport element within ScrollArea
		const scrollAreaViewport = scrollAreaRoot.querySelector(
			'[data-slot="scroll-area-viewport"]',
		) as HTMLElement | null

		if (!scrollAreaViewport) {
			console.debug('[useScrollToActive] No viewport found in scrollAreaRoot', {
				scrollAreaRoot,
				children: Array.from(scrollAreaRoot.children).map((c) => ({
					tag: c.tagName,
					classes: c.className,
					dataSlot: c.getAttribute('data-slot'),
				})),
			})
			return
		}

		console.debug('[useScrollToActive] Found viewport', scrollAreaViewport)

		// Poll until content is ready, then scroll
		let pollTimeoutId: NodeJS.Timeout | null = null
		let retryCount = 0
		const maxRetries = 50 // ~5 seconds max (50 * 100ms)
		const pollInterval = 100 // Check every 100ms

		function attemptScroll() {
			if (!scrollAreaRoot || !scrollAreaViewport) {
				return
			}

			// Scope query to scroll area to avoid conflicts
			const resourceToScrollTo = scrollAreaRoot.querySelector(
				'li[data-active="true"]',
			) as HTMLElement | null

			if (!resourceToScrollTo) {
				if (retryCount < maxRetries) {
					retryCount++
					pollTimeoutId = setTimeout(attemptScroll, pollInterval)
				} else {
					console.debug(
						'[useScrollToActive] No active resource found after max retries',
					)
				}
				return
			}

			// Check if element is actually rendered and has dimensions
			const resourceRect = resourceToScrollTo.getBoundingClientRect()
			if (resourceRect.height === 0) {
				if (retryCount < maxRetries) {
					retryCount++
					pollTimeoutId = setTimeout(attemptScroll, pollInterval)
				}
				return
			}

			// Check if viewport is actually scrollable (content must be taller than viewport)
			const isScrollable =
				scrollAreaViewport.scrollHeight > scrollAreaViewport.clientHeight

			if (!isScrollable) {
				if (retryCount < maxRetries) {
					retryCount++
					pollTimeoutId = setTimeout(attemptScroll, pollInterval)
				} else {
					console.debug(
						'[useScrollToActive] Viewport never became scrollable, content may not need scrolling',
					)
				}
				return
			}

			// Check if the accordion containing this lesson is open
			const parentAccordionContent = resourceToScrollTo.closest(
				'[data-slot="accordion-content"]',
			) as HTMLElement | null
			const isAccordionOpen =
				!parentAccordionContent ||
				parentAccordionContent.getAttribute('data-state') === 'open'

			if (!isAccordionOpen) {
				if (retryCount < maxRetries) {
					retryCount++
					pollTimeoutId = setTimeout(attemptScroll, pollInterval)
				} else {
					console.debug(
						'[useScrollToActive] Accordion never opened, cannot scroll to element',
					)
				}
				return
			}

			// Wait a bit more for accordion animation to fully complete
			setTimeout(() => {
				performScroll()
			}, 150)

			function performScroll() {
				if (!scrollAreaViewport || !resourceToScrollTo) {
					return
				}

				// Check if element is already visible in viewport
				const viewportRect = scrollAreaViewport.getBoundingClientRect()
				const resourceRect = resourceToScrollTo.getBoundingClientRect()

				const isElementVisible =
					resourceRect.top >= viewportRect.top &&
					resourceRect.bottom <= viewportRect.bottom

				if (isElementVisible) {
					console.debug(
						'[useScrollToActive] Element already visible, skipping scroll',
					)
					return
				}

				// Calculate position: element's top relative to viewport's top
				const offsetFromViewportTop = resourceRect.top - viewportRect.top
				const currentScrollTop = scrollAreaViewport.scrollTop

				// Calculate absolute position in scrollable content
				// If currentScrollTop is 0 (reset), use offsetFromViewportTop directly
				// Otherwise, add current scroll position
				const absolutePosition =
					currentScrollTop === 0 && offsetFromViewportTop > 0
						? offsetFromViewportTop
						: currentScrollTop + offsetFromViewportTop

				// Target scroll position with some padding from top
				const targetScrollTop = Math.max(0, absolutePosition - 16)
				const scrollHeight = scrollAreaViewport.scrollHeight
				const clientHeight = scrollAreaViewport.clientHeight
				const maxScroll = Math.max(0, scrollHeight - clientHeight)
				const finalScrollTop = Math.min(targetScrollTop, maxScroll)

				console.debug('[useScrollToActive] Scrolling', {
					offsetFromViewportTop,
					currentScrollTop,
					absolutePosition,
					targetScrollTop,
					scrollHeight,
					clientHeight,
					maxScroll,
					finalScrollTop,
					retryCount,
					willScroll: finalScrollTop > 0,
				})

				// Only scroll if we have a valid scroll position
				if (finalScrollTop <= 0 && targetScrollTop > 0) {
					console.warn(
						'[useScrollToActive] Cannot scroll - maxScroll is 0 or negative',
						{ scrollHeight, clientHeight, maxScroll, targetScrollTop },
					)
					// Mark as processed even if we can't scroll
					lastSlugRef.current = slugToScrollTo
					return
				}

				// Set scrollTop directly
				scrollAreaViewport.scrollTop = finalScrollTop

				console.debug(
					'[useScrollToActive] Set scrollTop to',
					finalScrollTop,
					'actual:',
					scrollAreaViewport.scrollTop,
				)

				// Mark this slug as processed after successful scroll
				lastSlugRef.current = slugToScrollTo

				// Multiple retries to handle accordion resets
				const retries = [100, 300, 500]
				retries.forEach((delay) => {
					setTimeout(() => {
						if (
							scrollAreaViewport &&
							Math.abs(scrollAreaViewport.scrollTop - finalScrollTop) > 10
						) {
							console.debug(
								`[useScrollToActive] Scroll position was reset after ${delay}ms, retrying`,
								{
									expected: finalScrollTop,
									actual: scrollAreaViewport.scrollTop,
								},
							)
							scrollAreaViewport.scrollTop = finalScrollTop
						}
					}, delay)
				})
			}
		}

		// Start polling after DOM is ready
		let rafId2: number | null = null
		const rafId1 = requestAnimationFrame(() => {
			rafId2 = requestAnimationFrame(() => {
				attemptScroll()
			})
		})

		return () => {
			cancelAnimationFrame(rafId1)
			if (rafId2 !== null) {
				cancelAnimationFrame(rafId2)
			}
			if (pollTimeoutId !== null) {
				clearTimeout(pollTimeoutId)
			}
		}
	}, [currentLessonSlug])

	return scrollAreaRef
}
