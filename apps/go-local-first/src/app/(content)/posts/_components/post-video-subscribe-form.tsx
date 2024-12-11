'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { redirectUrlBuilder, SubscribeToConvertkitForm } from '@/convertkit'
import { Subscriber } from '@/schemas/subscriber'
import common from '@/text/common'
import { track } from '@/utils/analytics'
import { cn } from '@/utils/cn'
import { twMerge } from 'tailwind-merge'

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

export const PostNewsletterCta: React.FC<
	React.PropsWithChildren<PrimaryNewsletterCtaProps>
> = ({
	children,
	className,
	id = 'post-newsletter-cta',
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
			aria-label="Newsletter sign-up"
			className={cn(
				'bg-muted relative flex w-full flex-row items-center border-t',
				className,
			)}
		>
			<div className="relative mx-auto flex w-full max-w-screen-xl flex-col items-center justify-between gap-5 md:container md:h-20 md:flex-row">
				<div
					className="via-muted-foreground/20 absolute -top-px left-0 z-10 h-px w-1/2 bg-gradient-to-r from-transparent to-transparent"
					aria-hidden="true"
				/>
				<div
					className="via-muted-foreground/20 absolute -bottom-px left-0 z-10 h-px w-full bg-gradient-to-r from-transparent to-transparent"
					aria-hidden="true"
				/>
				<div className="flex flex-row items-center justify-center gap-5 pt-5 text-center sm:pr-16 sm:text-left md:flex-col md:items-start md:gap-0 md:pt-0">
					<div className="flex items-center gap-2">
						<div className="fluid-xl font-heading font-semibold">
							Local First Tips
						</div>
					</div>
					<div className="text-muted-foreground fluid-base">
						Delivered to your inbox
					</div>
				</div>
				<div id={id} className="w-full md:w-auto">
					<SubscribeToConvertkitForm
						onSuccess={onSuccess ? onSuccess : handleOnSuccess}
						actionLabel={actionLabel}
						className="[&_input]:border-0"
					/>
				</div>
			</div>
		</section>
	)
}
