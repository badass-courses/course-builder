'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import SectionWrapper from '@/components/section-wrapper'
import {
	redirectUrlBuilder,
	SubscribeToCoursebuilderForm,
} from '@/convertkit/coursebuilder-subscribe-form'
import { Subscriber } from '@/schemas/subscriber'
import common from '@/text/common'
import { track } from '@/utils/analytics'
import { cn } from '@/utils/cn'

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
	// title = common['primary-newsletter-tittle'],
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
		<SectionWrapper
			id={id}
			aria-label="Newsletter sign-up"
			className={cn(
				'not-prose relative mx-auto flex flex-col items-center gap-8 bg-[linear-gradient(2deg,var(--jsv-purple)_25.45%,var(--jsv-pink)_44.96%,var(--jsv-orange)_71.42%)] px-6 py-12 sm:max-w-lg sm:bg-[linear-gradient(280deg,var(--jsv-purple)_15.97%,var(--jsv-pink)_45.03%,var(--jsv-orange)_84.46%)] sm:p-12 md:max-w-lg md:p-16 lg:max-w-none lg:flex-row lg:items-start lg:p-24',
				className,
			)}
		>
			<div className="absolute right-32 top-0 h-[310px] w-[192px] bg-[radial-gradient(circle,_rgba(255,255,255,0.1)_1px,_transparent_1px)] bg-[length:24px_24px]" />
			<div className="grow">
				{children ? (
					children
				) : (
					<div className="text-white">
						<h2 className="text-[1.75rem] leading-[1.4] tracking-tight sm:max-w-[400px] sm:text-3xl sm:leading-tight md:max-w-[400px] md:text-4xl md:leading-tight lg:text-5xl">
							<span className="opacity-80">Deeper</span>{' '}
							<span className="font-bold">Understanding</span>{' '}
							<span className="opacity-80">Awaits</span>
						</h2>
						<p className="mt-6 max-w-[544px] text-lg leading-relaxed sm:text-xl">
							{byline}
						</p>
					</div>
				)}
			</div>
			<div className="flex w-full shrink-0 flex-col items-center lg:max-w-[340px] xl:max-w-[415px]">
				<SubscribeToCoursebuilderForm
					onSuccess={onSuccess ? onSuccess : handleOnSuccess}
					actionLabel={actionLabel}
					className="text-jsv-charcoal-black relative z-10 w-full [&_input]:h-16"
				/>
				<p
					data-nospam=""
					className="max-w-64 pt-8 text-center text-sm text-white opacity-75 sm:max-w-none"
				>
					I respect your privacy. Unsubscribe at any time.
				</p>
			</div>
		</SectionWrapper>
	)
}
