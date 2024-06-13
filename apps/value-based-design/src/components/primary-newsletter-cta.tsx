'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { redirectUrlBuilder, SubscribeToConvertkitForm } from '@/convertkit'
import { Subscriber } from '@/schemas/subscriber'
import { track } from '@/utils/analytics'
import { twMerge } from 'tailwind-merge'

import common from '../text/common'

type PrimaryNewsletterCtaProps = {
	onSuccess?: () => void
	title?: string
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
		<section
			id={id}
			aria-label="Newsletter sign-up"
			className={twMerge(
				'bg-primary flex flex-col items-center px-6 py-16',
				className,
			)}
		>
			{children ? (
				children
			) : (
				<div className="relative flex flex-col items-center justify-center py-16">
					<h2 className="font-heading text-balance text-center text-4xl font-semibold sm:text-5xl xl:text-6xl">
						{title}
					</h2>
					<h3 className="mt-8 max-w-2xl text-balance text-center text-base opacity-80 sm:text-lg">
						{subtitle}
					</h3>
				</div>
			)}
			<SubscribeToConvertkitForm
				onSuccess={onSuccess ? onSuccess : handleOnSuccess}
				actionLabel={actionLabel}
				className="[&_button]:bg-foreground [&_button]:text-background mt-5 flex w-full max-w-4xl flex-col items-center gap-2 lg:flex-row [&_button]:h-14 [&_button]:w-full [&_button]:rounded-xl [&_button]:px-10 [&_button]:text-lg [&_button]:font-semibold [&_button]:hover:bg-gray-900 [&_input]:h-14 [&_input]:w-full [&_input]:rounded-xl [&_input]:border-none [&_input]:px-5 [&_input]:text-lg [&_input]:lg:w-80 [&_label]:sr-only"
			/>
			<div className="h-10 w-10" />
			<p data-nospam="" className="pt-0 text-center text-sm opacity-75 sm:pt-8">
				I respect your privacy. Unsubscribe at any time.
			</p>
		</section>
	)
}
