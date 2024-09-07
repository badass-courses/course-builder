'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { redirectUrlBuilder, SubscribeToConvertkitForm } from '@/convertkit'
import { Subscriber } from '@/schemas/subscriber'
import { track } from '@/utils/analytics'
import { cn } from '@/utils/cn'
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
			className={cn(
				'relative flex flex-col items-center overflow-hidden bg-gradient-to-tr from-blue-500 to-purple-500 px-5 py-20',
				className,
			)}
		>
			<div
				className="pointer-events-none absolute left-0 top-0 z-0 h-full w-full"
				style={{
					backgroundImage:
						'linear-gradient(to right, rgba(29,40,58,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(29,40,58,0.05) 1px, transparent 1px)',
					backgroundSize: '50px 50px',
				}}
				aria-hidden
			/>
			{children ? (
				children
			) : (
				<div className="relative z-10 flex max-w-2xl flex-col items-center justify-center pb-10 text-white">
					<h2 className="font-heading fluid-2xl text-center font-semibold ">
						{title}
					</h2>
					<h3 className="fluid-lg pt-4 text-center opacity-90">{byline}</h3>
				</div>
			)}
			<SubscribeToConvertkitForm
				onSuccess={onSuccess ? onSuccess : handleOnSuccess}
				actionLabel={actionLabel}
				className="relative z-10 [&_input]:h-16"
			/>
			<p
				data-nospam=""
				className="pt-8 text-center text-sm text-white opacity-75"
			>
				I respect your privacy. Unsubscribe at any time.
			</p>
		</section>
	)
}
