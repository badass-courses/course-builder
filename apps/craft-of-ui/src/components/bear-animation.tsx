'use client'

import * as React from 'react'
import { useEffect, useRef } from 'react'

/**
 * BearAnimation component that creates floating bear animations on subscription success
 * Implements the complete balloon bear animation system with random colors, positions, and durations
 */
export const BearAnimation: React.FC = () => {
	const bearCaveRef = useRef<HTMLDivElement>(null)
	const bearTemplateRef = useRef<HTMLDivElement>(null)

	/**
	 * Creates a new floating bear animation
	 * @param subscriber - The subscriber data from successful subscription
	 */
	const createFloatingBear = React.useCallback((subscriber: any) => {
		if (window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
			const successBear = bearTemplateRef.current?.cloneNode(
				true,
			) as HTMLElement

			if (successBear && bearCaveRef.current) {
				const randomHue = Math.random() * 359
				const randomX = Math.random().toFixed(2)
				const randomDuration = (10 + Math.random() * 20).toFixed(2)

				successBear.style.setProperty('--accent', `hsl(${randomHue} 90% 80%)`)
				successBear.style.setProperty('--x', randomX)
				successBear.style.setProperty('--duration', `${randomDuration}s`)

				const svg = successBear.querySelector('svg')
				if (svg) {
					svg.style.setProperty('--accent', `hsl(${randomHue} 90% 80%)`)
				}

				successBear.classList.remove('sr-only')
				successBear.style.animation = `float ${randomDuration}s linear 2s forwards`

				const balloonButton = successBear.querySelector('button')
				if (balloonButton) {
					balloonButton.addEventListener('click', () => {
						// Play pop sound
						const pop = new Audio('/audio/pop.mp3')
						pop.play()

						const balloon = successBear.querySelector('.balloon')
						if (balloon) {
							// Balloon pop animation
							balloon.animate(
								{
									scale: [2],
									opacity: [0],
								},
								{
									fill: 'forwards',
									duration: 75,
									easing: 'ease-out',
								},
							)

							successBear.animate(
								{
									translate: ['0 100%'],
								},
								{
									composite: 'replace',
									duration: 200,
									easing: 'linear',
								},
							).onfinish = () => {
								successBear.remove()
							}
						}
					})
				}

				bearCaveRef.current.appendChild(successBear)

				setTimeout(
					() => {
						if (successBear.parentNode) {
							successBear.remove()
						}
					},
					(parseFloat(randomDuration) + 2) * 1000,
				)
			}
		}
	}, [])

	useEffect(() => {
		;(window as any).createFloatingBear = createFloatingBear

		return () => {
			delete (window as any).createFloatingBear
		}
	}, [createFloatingBear])

	return (
		<>
			{/* Bear Cave Container */}
			<div
				ref={bearCaveRef}
				data-bear-cave
				className="pointer-events-none fixed inset-0 z-[100] mx-auto w-[600px] max-w-[calc(100vw-(2*var(--gutter)))] overflow-hidden [container-type:inline-size]"
			></div>

			{/* Bear Template (Hidden) */}
			<div
				ref={bearTemplateRef}
				data-bear-template
				className="sr-only absolute bottom-0 left-[calc((100cqi-4rem)*var(--x,0))] w-20 translate-y-full drop-shadow-lg"
			>
				<button className="pointer-events-auto absolute left-[4%] top-[1%] aspect-square w-[72%] cursor-pointer"></button>

				{/* Bear SVG with Balloon */}
				<svg
					className="h-full w-full overflow-visible"
					aria-hidden="true"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 478 931"
					style={{ '--accent': 'hsl(0 90% 80%)' } as React.CSSProperties}
				>
					<rect
						width="115"
						height="52"
						x="294.5"
						y="872.5"
						fill="#AF7128"
						stroke="#000"
						strokeWidth="6"
						rx="26"
						transform="rotate(-90 294.5 872.5)"
					/>
					<path
						fill="#000"
						d="M318.674 859.205c0-1.657-1.343-3-3-3s-3 1.343-3 3h6Zm0 12v-12h-6v12h6ZM331.34 859.205c0-1.657-1.344-3-3-3-1.657 0-3 1.343-3 3h6Zm0 12v-12h-6v12h6Z"
					/>
					<path
						fill="#AF7128"
						d="M272.653 584.433c-8.572-14.183-6.748-32.879 5.479-45.106 14.388-14.387 37.731-14.37 52.14.038 10.153 10.153 13.16 24.742 9.017 37.509 13.071 3.917 25.39 11.04 35.718 21.369l14.163 14.162c10.282 10.283 17.388 22.537 21.316 35.542 12.744-4.098 27.287-1.081 37.415 9.048 14.409 14.408 14.426 37.752.038 52.14-12.178 12.178-30.773 14.036-44.934 5.581-3.673 6.436-8.255 12.494-13.747 17.985l-47.065 47.066-77.583 77.583a36.9858 36.9858 0 0 0-5.206 6.541l-15.761 25.197c-3.206 5.125-6.75 10.464-12.384 12.655-7.89 3.068-17.198 1.412-23.575-4.965l-13.115-11.847-7.404-6.859-9.005-9.24c-8.604-8.604-5.834-20.208-1.015-30.609l13.314-23.061c-2.048-1.407-4.711-4.694-6.52-6.503-1.563-1.563-3.05-4.787-4.312-6.531L164.298 823.3c-6.512 8.418-20.241 9.852-28.845 1.247l-26.203-25.523c-8.604-8.604-15.4636-21.052-4.977-36.77l46.35-60.011c-.834-2.703-1.284-5.575-1.286-8.551l-.046-63.046c-.012-16.028 12.972-29.012 29-29 16.028.012 29.03 13.014 29.042 29.042l.011 14.834 47.367-47.367c5.48-5.48 11.522-10.054 17.942-13.722Z"
					/>
					<path
						stroke="#000"
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="6"
						d="m342.193 779.767 47.065-47.066c5.492-5.491 10.074-11.549 13.747-17.985 14.161 8.455 32.756 6.597 44.934-5.581 14.388-14.388 14.371-37.732-.038-52.14-10.128-10.129-24.671-13.146-37.415-9.048-3.928-13.005-11.034-25.259-21.316-35.542l-14.163-14.162c-10.328-10.329-22.647-17.452-35.718-21.369 4.143-12.767 1.136-27.356-9.017-37.509-14.409-14.408-37.752-14.425-52.14-.038-12.227 12.227-14.051 30.923-5.479 45.106-6.42 3.668-12.462 8.242-17.942 13.722l-47.367 47.367-.011-14.834c-.012-16.028-13.014-29.03-29.042-29.042-16.028-.012-29.012 12.972-29 29l.046 63.046c.002 2.976.452 5.848 1.286 8.551l-46.35 60.011c-10.4866 15.718-3.627 28.166 4.977 36.77l26.203 25.523c8.604 8.605 22.333 7.171 28.845-1.247l15.329-21.172c1.262 1.744 2.749 4.968 4.312 6.531 1.809 1.809 4.472 5.096 6.52 6.503l-13.314 23.061c-4.819 10.401-7.589 22.005 1.015 30.609l9.005 9.24 7.404 6.859 13.115 11.847c6.377 6.377 15.685 8.033 23.575 4.965 5.634-2.191 9.178-7.53 12.384-12.655l15.761-25.197a36.9858 36.9858 0 0 1 5.206-6.541l39.815-39.815"
					/>
					<path
						fill="#000"
						d="M178.783 616.187c.001 1.657 1.345 3.001 3.002 3.002 1.657.002 2.999-1.341 2.998-2.997l-6-.005Zm-.009-12.009.009 12.009 6 .005-.009-12.009-6-.005ZM166.676 616.178c.001 1.657 1.345 3.001 3.002 3.003 1.657.001 2.999-1.341 2.998-2.998l-6-.005Zm-.009-12.008.009 12.008 6 .005-.009-12.009-6-.004Z"
					/>
					<path
						fill="var(--accent,red)"
						d="m308.738 613.92 62.5788 62.5788-9.3692 9.3692-62.5788-62.5788z"
					/>
					<path
						fill="#000"
						fillRule="evenodd"
						d="M417.156 664.094c2.526 22.882-6.427 46.109-20.821 60.503l-43.655-43.655c9.604-9.727 9.566-25.397-.114-35.077l-13.194-13.194c-9.68-9.68-25.35-9.718-35.077-.114l-43.44-43.44c14.394-14.394 37.621-23.347 60.503-20.821 22.881 2.525 45.829 14.037 63.795 32.003s29.478 40.914 32.003 63.795Z"
						clipRule="evenodd"
					/>
					<ellipse
						className="origin-center rotate-45 animate-[blink_8s_infinite] [transform-box:fill-box]"
						cx="349.096"
						cy="714.26"
						fill="#000"
						rx="8.0911"
						ry="8.0793"
						transform="rotate(45 349.096 714.26)"
					/>
					<ellipse
						className="origin-center rotate-45 animate-[blink_8s_infinite] [transform-box:fill-box]"
						cx="272.202"
						cy="637.366"
						fill="#000"
						rx="8.0911"
						ry="8.0793"
						transform="rotate(45 272.202 637.366)"
					/>
					<path
						fill="#000"
						d="M315.046 700.863c-5.805 5.806-19.327 5.352-27.1-2.421s-8.227-21.295-2.421-27.101c5.805-5.805 15.671-1.695 23.444 6.078 7.773 7.773 11.883 17.639 6.077 23.444Z"
					/>
					<path
						stroke="#000"
						strokeLinecap="round"
						strokeWidth="6"
						d="m197.373 866.873-8.485 8.485M214.369 883.869l-8.486 8.485M124.435 793.935l-8.485 8.485M141.43 810.93l-8.485 8.485"
					/>
					<path
						stroke="#000"
						strokeLinecap="round"
						strokeWidth="5"
						d="m193.5 732.5-5-376"
					/>
					<g className="balloon origin-center [transform-box:fill-box]">
						<circle
							fillOpacity=".5"
							cx="188.5"
							cy="184.5"
							r="169"
							fill="var(--accent,red)"
							stroke="#000"
							strokeWidth="6"
						/>
						<path
							stroke="#fff"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeOpacity=".75"
							strokeWidth="30"
							d="M151.119 53.7383A135.997 135.997 0 0 0 83.5092 98.054a135.9978 135.9978 0 0 0-30.5146 74.858"
						/>
					</g>
					<path
						fill="var(--accent,red)"
						fillOpacity=".5"
						stroke="#000"
						strokeLinejoin="round"
						strokeWidth="6"
						d="M172.5 355.5H204l9.5 20h-50l9-20Z"
					/>
					<path
						stroke="#000"
						strokeLinecap="round"
						strokeWidth="6"
						d="m147 668 62-42"
					/>
				</svg>
			</div>
		</>
	)
}
