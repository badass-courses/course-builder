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
			className={cn('relative flex flex-col items-center px-5', className)}
		>
			{children ? (
				children
			) : (
				<div className="relative z-10 flex max-w-2xl flex-col items-center justify-center pb-10">
					<h2 className="font-heading fluid-3xl text-muted-foreground text-center font-semibold">
						{title}
					</h2>
					<h3 className="fluid-xl text-primary pt-8 text-center font-medium">
						{byline}
					</h3>
				</div>
			)}
			<SubscribeToConvertkitForm
				onSuccess={onSuccess ? onSuccess : handleOnSuccess}
				actionLabel={actionLabel}
				className="relative z-10 [&_input]:h-16"
			/>
			<p
				data-nospam=""
				className="text-muted-foreground pt-8 text-center text-sm opacity-75"
			>
				I respect your privacy. Unsubscribe at any time.
			</p>
		</section>
	)
}
