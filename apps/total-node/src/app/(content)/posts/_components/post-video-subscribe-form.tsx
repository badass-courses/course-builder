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
						<svg
							width="20"
							height="22"
							viewBox="0 0 20 22"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M9 1.57735C9.6188 1.22008 10.3812 1.22008 11 1.57735L17.6603 5.42265C18.2791 5.77992 18.6603 6.44017 18.6603 7.1547V14.8453C18.6603 15.5598 18.2791 16.2201 17.6603 16.5774L11 20.4226C10.3812 20.7799 9.6188 20.7799 9 20.4226L2.33975 16.5774C1.72094 16.2201 1.33975 15.5598 1.33975 14.8453V7.1547C1.33975 6.44017 1.72094 5.77992 2.33975 5.42265L9 1.57735Z"
								fill="#151515"
								stroke="#FFAB49"
								strokeLinecap="round"
								strokeDasharray="3 3"
							/>
						</svg>
						<div className="fluid-xl font-heading font-semibold">Node Tips</div>
					</div>
					<div className="text-primary fluid-lg font-heading">
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
