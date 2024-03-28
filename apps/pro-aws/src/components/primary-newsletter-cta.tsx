'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { redirectUrlBuilder, SubscribeToConvertkitForm } from '@/convertkit'
import { Subscriber } from '@/schemas/subscriber'
import { track } from '@/utils/analytics'
import Balancer from 'react-wrap-balancer'
import { twMerge } from 'tailwind-merge'

import common from '../text/common'

type PrimaryNewsletterCtaProps = {
	onSuccess?: () => void
	title?: string
	byline?: string
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
	id = 'primary-newsletter-cta',
	title = common['primary-newsletter-tittle'],
	byline = common['primary-newsletter-byline'],
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
		<section
			id={id}
			aria-label="Newsletter sign-up"
			className={twMerge('flex flex-col items-center', className)}
		>
			{children ? (
				children
			) : (
				<div className="relative flex flex-col items-center justify-center py-16">
					<Image className="absolute -z-10" />
					<h2 className="max-w-lg text-center text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
						<Balancer>{title}</Balancer>
					</h2>
					<h3 className="pt-4 text-center text-lg">{byline}</h3>
				</div>
			)}
			<SubscribeToConvertkitForm
				onSuccess={onSuccess ? onSuccess : handleOnSuccess}
				actionLabel={actionLabel}
			/>
			<div className="h-10 w-10" />
			<p data-nospam="" className="pt-0 text-center text-sm opacity-75 sm:pt-8">
				I respect your privacy. Unsubscribe at any time.
			</p>
		</section>
	)
}

const Image: React.FC<{ className?: string }> = ({ className = '' }) => {
	return (
		<svg
			className={className}
			width="284"
			height="284"
			viewBox="0 0 284 284"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M54.6154 141.85H0L142 283.701L284 141.85H229.385L142 229.143L54.6154 141.85Z"
				fill="url(#paint0_linear_145_1931)"
			/>
			<path
				d="M54.6154 70.9252H0L142 212.776L284 70.9252H229.385L142 158.218L54.6154 70.9252Z"
				fill="url(#paint1_linear_145_1931)"
			/>
			<path
				d="M54.6154 0H0L142 141.85L284 0H229.385L142 87.2925L54.6154 0Z"
				fill="url(#paint2_linear_145_1931)"
			/>
			<defs>
				<linearGradient
					id="paint0_linear_145_1931"
					x1="142"
					y1="141.85"
					x2="142"
					y2="283.701"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#080808" />
					<stop offset="1" stopColor="#252525" />
				</linearGradient>
				<linearGradient
					id="paint1_linear_145_1931"
					x1="142"
					y1="70.9252"
					x2="142"
					y2="212.776"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#080808" />
					<stop offset="1" stopColor="#252525" />
				</linearGradient>
				<linearGradient
					id="paint2_linear_145_1931"
					x1="142"
					y1="0"
					x2="142"
					y2="141.85"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#080808" />
					<stop offset="1" stopColor="#252525" />
				</linearGradient>
			</defs>
		</svg>
	)
}
