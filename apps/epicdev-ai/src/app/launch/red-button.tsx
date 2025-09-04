'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
// import {useSocket} from '@/hooks/useSocket'
import { useRouter } from 'next/navigation'
import { env } from '@/env.mjs'
import { useReward } from 'react-rewards'

import { useSocket } from '@coursebuilder/ui/hooks/use-socket'
import { cn } from '@coursebuilder/ui/utils/cn'

import Starfield from './starfield'

export default function RedButton({
	canPress,
	isCommerceEnabled,
}: {
	canPress: boolean
	isCommerceEnabled: boolean
}) {
	const { reward, isAnimating } = useReward('rewardId', 'confetti', {
		angle: 90,
		decay: 0.9,
		spread: 100,
	})
	const [isPressed, setIsPressed] = useState(false)
	const [shake, setShake] = useState(false)
	// const [confettiKey, setConfettiKey] = useState(0)
	const [starfieldSpeed, setStarfieldSpeed] = useState(0.5)
	const router = useRouter()
	const [isRipping, setIsRipping] = useState(false)
	function letItRip() {
		setIsPressed(true)
		setShake(true)
		reward()
		setStarfieldSpeed(20)
		setIsRipping(true)
		// Sequence of animations
		setTimeout(() => setShake(false), 500) // Stop shaking after 500ms
		setTimeout(() => setIsPressed(false), 250)
	}

	useSocket({
		room: 'launch',
		host: env.NEXT_PUBLIC_PARTY_KIT_URL,
		onMessage: async (messageEvent) => {
			if (!messageEvent || !messageEvent.data) return
			try {
				let messageData: string

				// Handle Blob data
				if (messageEvent.data instanceof Blob) {
					messageData = await messageEvent.data.text()
				} else {
					messageData = messageEvent.data
				}

				// Skip Y.js protocol messages
				// if (messageData.includes('\u0000')) {
				// 	return
				// }

				const data = JSON.parse(messageData)
				if (data.name === 'launch.initiated') {
					letItRip()
					setIsRipping(true)
				}
			} catch (error) {
				// Silently ignore Y.js parse errors
			}
		},
	})

	const handleClick = () => {
		if (canPress) {
			letItRip()

			// setTimeout(() => {
			// 	router.push('/cohorts/master-mcp')
			// }, 5000)
		}
	}

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.code === 'Space' || e.code === 'Enter') {
				handleClick()
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => {
			window.removeEventListener('keydown', handleKeyDown)
		}
	}, [])

	return (
		<div
			className={`flex min-h-screen w-full items-center justify-center bg-gray-900 ${
				shake ? 'animate-shake' : ''
			}`}
			style={{
				perspective: '1000px',
			}}
		>
			<Starfield speed={starfieldSpeed} />
			<h1 className="left-.5 absolute top-7 z-10 text-5xl font-bold text-white opacity-50">
				epicai.pro/launch
			</h1>
			<button
				// disabled={isRipping}
				type="submit"
				onClick={handleClick}
				className={`font-heading relative flex size-80 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-red-500 to-red-700 text-4xl font-bold text-white ${
					isPressed
						? 'shadow-[0_5px_0_0_#7f1d1d,0_15px_30px_-5px_rgba(0,0,0,0.5)]'
						: 'shadow-[0_17px_0_0_#7f1d1d,0_15px_30px_-5px_rgba(0,0,0,0.5)]'
				} transition-colors duration-300 hover:brightness-110 focus:outline-none active:shadow-[0_17px_0_0_#7f1d1d,0_15px_30px_-5px_rgba(0,0,0,0.5)]`}
			>
				<span className="relative z-10 translate-y-[5px] uppercase drop-shadow-lg">
					Launch
				</span>
				<div
					className={`absolute inset-0 bg-gradient-to-br from-yellow-400 to-red-600 transition-opacity duration-300 ${isPressed ? 'opacity-80' : 'opacity-0'} `}
				/>
				<div
					className={`absolute inset-0 rounded-full ${isPressed ? 'animate-pulse-glow' : 'animate-subtle-pulse-glow'} `}
				/>
			</button>
			<span className="absolute" id="rewardId" />
			<div>
				{(isRipping || isCommerceEnabled) && (
					<Link
						className={cn(
							'absolute bottom-10 left-0 w-full text-center text-2xl font-bold text-white underline underline-offset-2',
							{},
						)}
						href="/cohorts/master-mcp"
					>
						<span className="no-underline">Launched:</span> Master the Model
						Context Protocol (MCP) →
					</Link>
				)}
			</div>

			<style jsx global>{`
				button {
					transform-style: preserve-3d;
					transform: rotateX(40deg) rotateY(0) rotateZ(0);
				}

				@keyframes pulse-glow {
					0%,
					100% {
						box-shadow:
							0 0 20px 10px rgba(255, 0, 0, 0.5),
							0 0 40px 20px rgba(255, 0, 0, 0.3),
							0 0 60px 30px rgba(255, 0, 0, 0.1);
					}
					50% {
						box-shadow:
							0 0 30px 15px rgba(255, 0, 0, 0.8),
							0 0 60px 30px rgba(255, 0, 0, 0.5),
							0 0 90px 45px rgba(255, 0, 0, 0.2);
					}
				}

				@keyframes subtle-pulse-glow {
					0%,
					100% {
						box-shadow:
							0 0 10px 5px rgba(255, 0, 0, 0.3),
							0 0 20px 10px rgba(255, 0, 0, 0.1);
					}
					50% {
						box-shadow:
							0 0 15px 7px rgba(255, 0, 0, 0.4),
							0 0 30px 15px rgba(255, 0, 0, 0.2);
					}
				}

				.animate-pulse-glow {
					animation: pulse-glow 2s infinite;
				}

				.animate-subtle-pulse-glow {
					animation: subtle-pulse-glow 3s infinite;
				}

				@keyframes shake {
					0%,
					100% {
						transform: translateX(0);
					}
					10%,
					30%,
					50%,
					70%,
					90% {
						transform: translate3d(-15px, -5px, -2px);
					}
					20%,
					40%,
					60%,
					80% {
						transform: translate3d(15px, 5px, 2px);
					}
				}

				.animate-shake {
					animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
				}

				/* Hide scrollbar for Chrome, Safari and Opera */
				.no-scrollbar::-webkit-scrollbar {
					display: none;
				}

				/* Hide scrollbar for IE, Edge and Firefox */
				.no-scrollbar {
					-ms-overflow-style: none; /* IE and Edge */
					scrollbar-width: none; /* Firefox */
				}

				/* Ensure the page takes up full height and hides overflow */
				html,
				body {
					height: 100%;
					overflow: hidden;
				}
			`}</style>
		</div>
	)
}
