'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { redirectUrlBuilder, SubscribeToConvertkitForm } from '@/convertkit'
import { Subscriber } from '@/schemas/subscriber'
import { track } from '@/utils/analytics'
import {
	InformationCircleIcon,
	ShieldCheckIcon,
} from '@heroicons/react/24/outline'
import ReactMarkdown from 'react-markdown'
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
	moduleTitle?: string
}

export const VideoBlockNewsletterCta: React.FC<
	React.PropsWithChildren<VideoBlockNewsletterCtaProps>
> = ({
	children,
	className,
	id = 'video-block-newsletter-cta',
	moduleTitle = 'No Title',

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
				'flex grid-cols-2 flex-col items-center justify-center gap-10 lg:grid',
				className,
			)}
		>
			<div className="flex w-full flex-col items-center justify-center gap-2 md:gap-5">
				{children}
				<strong className="text-balance text-center text-xl font-semibold lg:text-2xl">
					{common['video-block-newsletter-tittle'](moduleTitle)}
				</strong>
				<SubscribeToConvertkitForm
					onSuccess={onSuccess ? onSuccess : handleOnSuccess}
					actionLabel={actionLabel}
				/>
				<p
					data-nospam=""
					className="inline-flex items-center gap-1 pt-0 text-left text-sm opacity-75"
				>
					<ShieldCheckIcon className="h-4 w-4" aria-hidden="true" /> I respect
					your privacy. Unsubscribe at any time.
				</p>
			</div>
			<div>
				<strong className="mb-4 inline-flex gap-1 text-lg font-medium">
					<InformationCircleIcon className="w-5" /> This is a free tutorial
				</strong>
				<ReactMarkdown className="prose dark:prose-invert">
					{common['video-block-newsletter-description']}
				</ReactMarkdown>
			</div>
		</div>
	)
}
