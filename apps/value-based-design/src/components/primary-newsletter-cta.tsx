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
		<div
			id={id}
			aria-label="Newsletter sign-up"
			className={twMerge('', className)}
		>
			{withTitle && (
				<>
					{children ? (
						children
					) : (
						<div className="relative flex flex-col items-center justify-center py-16">
							<h2 className="font-heading fluid-lg text-balance text-center font-semibold">
								{title}
							</h2>
							<h3 className="mt-8 max-w-2xl text-balance text-center text-base opacity-80 sm:text-lg">
								{subtitle}
							</h3>
						</div>
					)}
				</>
			)}
			<SubscribeToConvertkitForm
				onSuccess={onSuccess ? onSuccess : handleOnSuccess}
				actionLabel={actionLabel}
				className="flex flex-col items-end gap-3 sm:flex-row"
			/>
			{/* <div className="h-10 w-10" />
			<p data-nospam="" className="pt-0 text-center text-sm opacity-75 sm:pt-8">
				I respect your privacy. Unsubscribe at any time.
			</p> */}
		</div>
	)
}
