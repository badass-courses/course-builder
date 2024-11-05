'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { redirectUrlBuilder, SubscribeToConvertkitForm } from '@/convertkit'
import { Subscriber } from '@/schemas/subscriber'
import { track } from '@/utils/analytics'
import { twMerge } from 'tailwind-merge'

import common from '../text/common'

type TipNewsletterCtaProps = {
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

export const TipNewsletterCta: React.FC<
	React.PropsWithChildren<TipNewsletterCtaProps>
> = ({
	children,
	className,
	id = 'tip-newsletter-cta',
	title = common['tip-newsletter-tittle'],
	actionLabel = common['tip-newsletter-button-cta-label'],
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
				'container flex w-full flex-col items-center justify-center gap-2 border-x md:flex-row md:gap-5',
				className,
			)}
		>
			<p className="flex-shrink-0 pt-5 md:pt-0">{title}</p>
			<SubscribeToConvertkitForm
				onSuccess={onSuccess ? onSuccess : handleOnSuccess}
				actionLabel={actionLabel}
			/>
		</section>
	)
}
