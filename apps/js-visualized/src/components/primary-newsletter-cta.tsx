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
				'not-prose relative flex flex-col items-center gap-8 bg-[linear-gradient(280deg,var(--jsv-purple)_15.97%,var(--jsv-pink)_45.03%,var(--jsv-orange)_84.46%)] p-8 md:p-24 lg:flex-row lg:items-start',
				className,
			)}
		>
			<div className="absolute right-32 top-0 h-[310px] w-[192px] bg-[radial-gradient(circle,_rgba(255,255,255,0.1)_1px,_transparent_1px)] bg-[length:24px_24px]" />
			<div className="grow">
				{children ? (
					children
				) : (
					<div className="text-white">
						<h2 className="capita text-5xl leading-[1.08] tracking-tight">
							<span className="opacity-80">Deeper</span>
							<br />
							<span className="font-bold">Understanding</span>
							<br />
							<span className="opacity-80">Awaits</span>
						</h2>
						<p className="mt-6 max-w-[544px] leading-relaxed">{byline}</p>
					</div>
				)}
			</div>
			<div className="w-full max-w-[415px] shrink-0">
				<SubscribeToCoursebuilderForm
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
			</div>
		</SectionWrapper>
	)
}
