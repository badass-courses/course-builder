'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { redirectUrlBuilder, SubscribeToConvertkitForm } from '@/convertkit'
import { Subscriber } from '@/schemas/subscriber'
import { track } from '@/utils/analytics'
import { twMerge } from 'tailwind-merge'

import common from '../text/common'

type VideoBlockNewsletterCtaProps = {
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
	moduleTitle: string
}

export const VideoBlockNewsletterCta: React.FC<
	React.PropsWithChildren<VideoBlockNewsletterCtaProps>
> = ({
	children,
	className,
	id = 'video-newsletter-cta',
	moduleTitle,
	actionLabel = common['video-block-newsletter-button-cta-label'],
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
		<div
			id={id}
			aria-label="Newsletter sign-up"
			className={twMerge(
				'container flex w-full flex-col items-center justify-center gap-2 md:gap-5',
				className,
			)}
		>
			{common['video-block-newsletter-tittle'](moduleTitle)}
			<SubscribeToConvertkitForm
				onSuccess={onSuccess ? onSuccess : handleOnSuccess}
				actionLabel={actionLabel}
			/>
		</div>
	)
}
