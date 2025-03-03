'use client'

import { usePathname } from 'next/navigation'

import { cn } from '@coursebuilder/ui/utils/cn'

/**
 * Client-side layout component that handles container styling and side patterns
 */
export default function LayoutClient({
	children,
}: {
	children: React.ReactNode
}) {
	const pathname = usePathname()
	const pathsWithContainer = ['/']
	const showContainer = pathname === '/'
	console.log({ showContainer })
	return (
		<div
			className={cn('', {
				'container relative border-x px-0': showContainer,
			})}
		>
			<div className="absolute -left-4 bottom-0 top-0 flex flex-col">
				<SidePatternColumn side="left" />
			</div>
			{children}
			<div className="absolute -right-4 bottom-0 top-0 flex flex-col">
				<SidePatternColumn side="right" />
			</div>
		</div>
	)
}

/**
 * Creates a column of repeating SidePattern components
 */
const SidePatternColumn = ({ side }: { side: 'left' | 'right' }) => {
	return (
		<div className="flex h-full flex-col" aria-hidden="true">
			{/* This will repeat the pattern as many times as needed to fill the container height */}
			<div className="flex flex-1 flex-col">
				{Array.from({ length: 100 }).map((_, index) => (
					<SidePattern key={index} flipped={side === 'right'} />
				))}
			</div>
		</div>
	)
}

/**
 * SVG pattern component for the side decoration
 */
const SidePattern = ({ flipped = false }: { flipped?: boolean }) => {
	return (
		<svg
			width="16"
			height="36"
			viewBox="0 0 16 36"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			style={{ transform: flipped ? 'scaleX(-1)' : 'none' }}
		>
			<g opacity="0.2">
				<mask
					id="mask0_727_253220"
					style={{ maskType: 'alpha' }}
					maskUnits="userSpaceOnUse"
					x="0"
					y="0"
					width="16"
					height="36"
				>
					<rect y="0.714294" width="16" height="35" fill="#D9D9D9" />
				</mask>
				<g mask="url(#mask0_727_253220)">
					<rect y="0.714294" width="0.653061" height="1.42857" fill="#D9D9D9" />
					<rect
						x="1.63281"
						y="4.28574"
						width="0.653061"
						height="1.42857"
						fill="#D9D9D9"
					/>
					<rect
						x="3.26514"
						y="0.714294"
						width="0.653061"
						height="1.42857"
						fill="#D9D9D9"
					/>
					<rect
						x="4.89795"
						y="4.28574"
						width="0.653061"
						height="1.42857"
						fill="#D9D9D9"
					/>
					<rect
						x="6.53076"
						y="0.714294"
						width="0.653061"
						height="1.42857"
						fill="#D9D9D9"
					/>
					<rect
						x="8.16309"
						y="4.28574"
						width="0.653061"
						height="1.42857"
						fill="#D9D9D9"
					/>
					<rect
						x="9.7959"
						y="0.714294"
						width="0.653061"
						height="1.42857"
						fill="#D9D9D9"
					/>
					<rect
						x="11.4287"
						y="4.28574"
						width="0.653061"
						height="1.42857"
						fill="#D9D9D9"
					/>
					<rect
						x="13.061"
						y="0.714294"
						width="0.653061"
						height="1.42857"
						fill="#D9D9D9"
					/>
					<rect
						x="14.6938"
						y="4.28574"
						width="0.653061"
						height="1.42857"
						fill="#D9D9D9"
					/>
					<rect y="7.85715" width="0.653061" height="1.42857" fill="#D9D9D9" />
					<rect y="15" width="0.653061" height="1.42857" fill="#D9D9D9" />
					<rect y="22.1429" width="0.653061" height="1.42857" fill="#D9D9D9" />
					<rect y="29.2857" width="0.653061" height="1.42857" fill="#D9D9D9" />
					<rect
						x="1.63281"
						y="11.4286"
						width="0.653061"
						height="1.42857"
						fill="#D9D9D9"
					/>
					<rect
						x="1.63281"
						y="18.5714"
						width="0.653061"
						height="1.42857"
						fill="#D9D9D9"
					/>
					<rect
						x="1.63281"
						y="25.7143"
						width="0.653061"
						height="1.42857"
						fill="#D9D9D9"
					/>
					<rect
						x="1.63281"
						y="32.8571"
						width="0.653061"
						height="1.42857"
						fill="#D9D9D9"
					/>
					<rect
						x="3.26514"
						y="7.85715"
						width="0.653061"
						height="1.42857"
						fill="#D9D9D9"
					/>
					<rect
						x="3.26514"
						y="15"
						width="0.653061"
						height="1.42857"
						fill="#D9D9D9"
					/>
					<rect
						x="3.26514"
						y="22.1429"
						width="0.653061"
						height="1.42857"
						fill="#D9D9D9"
					/>
					<rect
						x="3.26514"
						y="29.2857"
						width="0.653061"
						height="1.42857"
						fill="#D9D9D9"
					/>
					<rect
						x="4.89795"
						y="11.4286"
						width="0.653061"
						height="1.42857"
						fill="#D9D9D9"
					/>
					<rect
						x="4.89795"
						y="18.5714"
						width="0.653061"
						height="1.42857"
						fill="#D9D9D9"
					/>
					<rect
						x="4.89795"
						y="25.7143"
						width="0.653061"
						height="1.42857"
						fill="#D9D9D9"
					/>
					<rect
						x="4.89795"
						y="32.8571"
						width="0.653061"
						height="1.42857"
						fill="#D9D9D9"
					/>
					<rect
						x="6.53076"
						y="7.85715"
						width="0.653061"
						height="1.42857"
						fill="#D9D9D9"
					/>
					<rect
						x="6.53076"
						y="15"
						width="0.653061"
						height="1.42857"
						fill="#D9D9D9"
					/>
					<rect
						x="6.53076"
						y="22.1429"
						width="0.653061"
						height="1.42857"
						fill="#D9D9D9"
					/>
					<rect
						x="6.53076"
						y="29.2857"
						width="0.653061"
						height="1.42857"
						fill="#D9D9D9"
					/>
					<rect
						x="8.16309"
						y="11.4286"
						width="0.653061"
						height="1.42857"
						fill="#D9D9D9"
					/>
					<rect
						x="8.16309"
						y="18.5714"
						width="0.653061"
						height="1.42857"
						fill="#D9D9D9"
					/>
					<rect
						x="8.16309"
						y="25.7143"
						width="0.653061"
						height="1.42857"
						fill="#D9D9D9"
					/>
					<rect
						x="8.16309"
						y="32.8571"
						width="0.653061"
						height="1.42857"
						fill="#D9D9D9"
					/>
					<rect
						x="9.7959"
						y="7.85715"
						width="0.653061"
						height="1.42857"
						fill="#D9D9D9"
					/>
					<rect
						x="9.7959"
						y="15"
						width="0.653061"
						height="1.42857"
						fill="#D9D9D9"
					/>
					<rect
						x="9.7959"
						y="22.1429"
						width="0.653061"
						height="1.42857"
						fill="#D9D9D9"
					/>
					<rect
						x="9.7959"
						y="29.2857"
						width="0.653061"
						height="1.42857"
						fill="#D9D9D9"
					/>
					<rect
						x="11.4287"
						y="11.4286"
						width="0.653061"
						height="1.42857"
						fill="#D9D9D9"
					/>
					<rect
						x="11.4287"
						y="18.5714"
						width="0.653061"
						height="1.42857"
						fill="#D9D9D9"
					/>
					<rect
						x="11.4287"
						y="25.7143"
						width="0.653061"
						height="1.42857"
						fill="#D9D9D9"
					/>
					<rect
						x="11.4287"
						y="32.8571"
						width="0.653061"
						height="1.42857"
						fill="#D9D9D9"
					/>
					<rect
						x="13.061"
						y="7.85715"
						width="0.653061"
						height="1.42857"
						fill="#D9D9D9"
					/>
					<rect
						x="13.061"
						y="15"
						width="0.653061"
						height="1.42857"
						fill="#D9D9D9"
					/>
					<rect
						x="14.6938"
						y="11.4286"
						width="0.653061"
						height="1.42857"
						fill="#D9D9D9"
					/>
					<rect
						x="13.061"
						y="22.1429"
						width="0.653061"
						height="1.42857"
						fill="#D9D9D9"
					/>
					<rect
						x="13.061"
						y="29.2857"
						width="0.653061"
						height="1.42857"
						fill="#D9D9D9"
					/>
					<rect
						x="14.6938"
						y="18.5714"
						width="0.653061"
						height="1.42857"
						fill="#D9D9D9"
					/>
					<rect
						x="14.6938"
						y="25.7143"
						width="0.653061"
						height="1.42857"
						fill="#D9D9D9"
					/>
					<rect
						x="14.6938"
						y="32.8571"
						width="0.653061"
						height="1.42857"
						fill="#D9D9D9"
					/>
				</g>
			</g>
		</svg>
	)
}
