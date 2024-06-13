import { useEffect, useRef, useState } from 'react'

interface UseStickyResult {
	ref: React.RefObject<HTMLDivElement>
	isSticky: boolean
}

export const useSticky = (): UseStickyResult => {
	const ref = useRef<HTMLDivElement>(null)
	const [isSticky, setIsSticky] = useState<boolean>(false)

	useEffect(() => {
		const checkPosition = () => {
			if (ref.current) {
				const rect = ref.current.getBoundingClientRect()
				if (rect.top <= 0 && !isSticky) {
					setIsSticky(true)
				} else if (rect.top > 0 && isSticky) {
					setIsSticky(false)
				}
			}
		}

		window.addEventListener('scroll', checkPosition)
		return () => {
			window.removeEventListener('scroll', checkPosition)
		}
	}, [isSticky])

	return { ref, isSticky }
}
