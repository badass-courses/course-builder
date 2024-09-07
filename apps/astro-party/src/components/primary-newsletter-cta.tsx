'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { redirectUrlBuilder, SubscribeToConvertkitForm } from '@/convertkit'
import { Subscriber } from '@/schemas/subscriber'
import { track } from '@/utils/analytics'
import { motion } from 'framer-motion'

import { cn } from '@coursebuilder/ui/utils/cn'

import common from '../text/common'
import Spinner from './spinner'

type PrimaryNewsletterCtaProps = {
	onSuccess?: () => void
	title?: string
	withTitle?: boolean
	subtitle?: string
	actionLabel?: string
	id?: string
	className?: string
	trackProps?: {
		event?: string
		params?: Record<string, string>
	}
}

export const PrimaryNewsletterCta: React.FC<
	React.PropsWithChildren<PrimaryNewsletterCtaProps>
> = ({
	children,
	className,
	withTitle = true,
	id = 'primary-newsletter-cta',
	title = common['primary-newsletter-tittle'],
	subtitle = common['primary-newsletter-subtitle'],
	actionLabel = common['primary-newsletter-button-cta-label'],
	trackProps = { event: 'subscribed', params: {} },
	onSuccess,
}) => {
	const router = useRouter()
	const handleOnSuccess = (subscriber: Subscriber | undefined) => {
		if (subscriber) {
			track(trackProps.event as string, trackProps.params)
			const redirectUrl = redirectUrlBuilder(subscriber, '/confirm')
			router.push(redirectUrl)
		}
	}

	return (
		<div id={id} aria-label="Newsletter sign-up" className={cn('', className)}>
			{withTitle && (
				<>
					{children ? (
						children
					) : (
						<div className="relative flex flex-col items-center justify-center py-16 text-white">
							<h2 className="font-heading fluid-2xl text-balance text-center font-bold">
								{title}
							</h2>
						</div>
					)}
				</>
			)}
			<SubscribeToConvertkitForm
				onSuccess={onSuccess ? onSuccess : handleOnSuccess}
				actionLabel={actionLabel}
				submitButtonElem={<SubmitButton />}
			/>
			<div className="h-10 w-10" />
			<p
				data-nospam=""
				className="pt-0 text-center text-base text-white sm:pt-8"
			>
				I respect your privacy. Unsubscribe at any time.
			</p>
		</div>
	)
}

const SubmitButton: React.FC<any> = ({ isLoading }) => {
	const [hovered, setHovered] = React.useState(false)
	const isAnimating = true
	return (
		<button
			onMouseOver={() => {
				setHovered(true)
			}}
			onMouseOut={() => {
				setHovered(false)
			}}
			className="font-heading relative z-10 mt-4 flex h-full items-center justify-center overflow-hidden rounded-full border-4 border-black bg-black py-5 text-2xl font-bold text-white transition"
		>
			<span
				className={cn(
					'relative z-10 rounded-full px-4 py-1.5 shadow-xl shadow-black/20',
					{
						'bg-black': isAnimating,
					},
				)}
			>
				{isLoading ? <Spinner className="h-8 w-8" /> : 'Subscribe, friend!'}
			</span>
			{isAnimating && (
				<motion.div
					className="absolute z-0 flex h-full w-full items-center justify-center"
					aria-hidden="true"
					transition={{
						repeat: Infinity,
						ease: 'linear',
						duration: isLoading ? 4 : 10,
					}}
					animate={{
						x: ['-25%', '19%'],
					}}
				>
					{new Array(4).fill(null).map((_, i) => (
						<svg
							key={i}
							xmlns="http://www.w3.org/2000/svg"
							width="768"
							height="108"
							fill="none"
							viewBox="0 0 768 108"
							className="absolute origin-left scale-150"
						>
							<mask
								id="a"
								width="768"
								height="108"
								x="0"
								y="0"
								maskUnits="userSpaceOnUse"
								style={{ maskType: 'alpha' }}
							>
								<path fill="#D9D9D9" d="M0 0h768v108H0z" />
							</mask>
							<g mask="url(#a)">
								<path
									fill="#EB5228"
									stroke="#000"
									strokeWidth="2"
									d="M52 1h32L34 107H2L52 1Z"
								/>
								<path
									fill="#F5D000"
									stroke="#000"
									strokeWidth="2"
									d="M84 1h32L66 107H34L84 1Zm128 0h32l-50 106h-32L212 1Zm128 0h32l-50 106h-32L340 1Zm128 0h32l-50 106h-32L468 1Zm128 0h32l-50 106h-32L596 1Zm128 0h32l-50 106h-32L724 1Z"
								/>
								<path
									fill="#009A51"
									stroke="#000"
									strokeWidth="2"
									d="M244 1h32l-50 106h-32L244 1ZM116 1h32L98 107H66L116 1Zm256 0h32l-50 106h-32L372 1Zm128 0h32l-50 106h-32L500 1Zm128 0h32l-50 106h-32L628 1Zm128 0h32l-50 106h-32L756 1Z"
								/>
								<path
									fill="#6D92F4"
									stroke="#000"
									strokeWidth="2"
									d="M148 1h32l-50 106H98L148 1Zm128 0h32l-50 106h-32L276 1Z"
								/>
								<path
									fill="#EB5228"
									stroke="#000"
									strokeWidth="2"
									d="M180 1h32l-50 106h-32L180 1Z"
								/>
								<path
									fill="#009A51"
									stroke="#000"
									strokeWidth="2"
									d="M-12 1h32l-50 106h-32L-12 1Z"
								/>
								<path
									fill="#6D92F4"
									stroke="#000"
									strokeWidth="2"
									d="M20 1h32L2 107h-32L20 1Zm384 0h32l-50 106h-32L404 1Zm128 0h32l-50 106h-32L532 1Zm128 0h32l-50 106h-32L660 1Zm128 0h32l-50 106h-32L788 1Z"
								/>
								<path
									fill="#EB5228"
									stroke="#000"
									strokeWidth="2"
									d="M308 1h32l-50 106h-32L308 1Zm128 0h32l-50 106h-32L436 1Zm128 0h32l-50 106h-32L564 1Zm128 0h32l-50 106h-32L692 1Z"
								/>
							</g>
						</svg>
					))}
				</motion.div>
			)}
		</button>
	)
}
