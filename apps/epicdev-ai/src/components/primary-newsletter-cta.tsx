'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { redirectUrlBuilder, SubscribeToConvertkitForm } from '@/convertkit'
import { Subscriber } from '@/schemas/subscriber'
import { api } from '@/trpc/react'
import { track } from '@/utils/analytics'
import { cn } from '@/utils/cn'
import { LockIcon, ShieldCheckIcon } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { twMerge } from 'tailwind-merge'

import common from '../text/common'
import { CldImage } from './cld-image'

type PrimaryNewsletterCtaProps = {
	onSuccess?: (router: any) => void
	title?: string
	byline?: string
	actionLabel?: string
	id?: string
	formId?: number
	className?: string
	subscribedTitle?: string
	subscribedSubtitle?: string
	shouldHideTitleWhenSubscribed?: boolean
	withImage?: boolean
	trackProps?: {
		event?: string
		params?: Record<string, string>
	}
	resource?: {
		path: string
		title: string
		type: string
	}
	isHiddenForSubscribers?: boolean
}

export const PrimaryNewsletterCta: React.FC<
	React.PropsWithChildren<PrimaryNewsletterCtaProps>
> = ({
	resource,
	children,
	className,
	formId,
	withImage = false,
	id = 'primary-newsletter-cta',
	title = common['primary-newsletter-tittle'],
	byline = common['primary-newsletter-byline'],
	actionLabel = common['primary-newsletter-button-cta-label'],
	subscribedTitle,
	subscribedSubtitle,
	trackProps = { event: 'subscribed', params: {} },
	isHiddenForSubscribers = false,
	shouldHideTitleWhenSubscribed = false,
	onSuccess,
}) => {
	const router = useRouter()
	const { data: subscriber, status } =
		api.ability.getCurrentSubscriberFromCookie.useQuery()

	const handleOnSuccess = (subscriber: Subscriber | undefined) => {
		if (subscriber) {
			track(trackProps.event as string, trackProps.params)
			const redirectUrl = redirectUrlBuilder(subscriber, '/confirm')
			router.push(redirectUrl)
		}
	}
	const { data: session } = useSession()

	if (isHiddenForSubscribers && subscriber) {
		return null
	}

	return (
		<section
			id={id}
			aria-label="Newsletter sign-up"
			className={cn(
				'not-prose flex flex-col items-center justify-center',
				className,
			)}
		>
			{children ? (
				children
			) : (
				<div
					className={cn(
						'relative z-10 flex max-w-3xl flex-col items-center justify-center pb-5 pt-10 sm:pb-10',
						{
							'blur-xs opacity-85': subscriber && shouldHideTitleWhenSubscribed,
						},
					)}
				>
					{withImage && (
						<CldImage
							src="https://res.cloudinary.com/epic-web/image/upload/v1744279600/epicdev.ai/beacon_2x.png"
							width={281 * 1.2}
							height={206 * 1.2}
							alt=""
							aria-hidden="true"
							className="mx-auto mb-5"
						/>
					)}
					<h2 className="sm:fluid-2xl fluid-2xl text-balance text-center font-semibold leading-tight tracking-tight">
						{title}
					</h2>
					<h3 className="text-primary max-w-md text-balance pt-5 text-center font-sans text-base font-normal leading-tight sm:text-lg lg:text-xl">
						{byline}
					</h3>
				</div>
			)}

			<div className="not-prose relative flex w-full items-center justify-center">
				{subscriber && (
					<div className="absolute z-10 flex -translate-y-8 flex-col text-center">
						<p className="text-lg font-semibold sm:text-xl lg:text-2xl">
							{subscribedTitle || "You're subscribed, thanks!"}
						</p>
						<p className="[&_a]:text-primary pt-3 text-center font-sans text-lg font-normal">
							{subscribedSubtitle ||
								(session?.user
									? common['newsletter-subscribed-logged-in']({
											resource,
										})
									: common['newsletter-subscribed-logged-out']({
											resource,
										}))}
						</p>
					</div>
				)}
				<div
					className={cn('flex w-full max-w-sm flex-col items-center', {
						'blur-xs pointer-events-none select-none opacity-75 transition ease-in-out':
							subscriber && !formId,
					})}
				>
					<SubscribeToConvertkitForm
						onSuccess={onSuccess ? onSuccess : handleOnSuccess}
						actionLabel={actionLabel}
						formId={formId}
						className="[&_input]:border-foreground/40 relative z-10 [&_input]:h-16"
					/>
					{!formId && (
						<p
							data-nospam=""
							className="text-muted-foreground inline-flex items-center pt-8 text-xs opacity-75 sm:text-sm"
						>
							<ShieldCheckIcon className="mr-2 h-4 w-4" /> I respect your
							privacy. Unsubscribe at any time.
						</p>
					)}
				</div>
			</div>
		</section>
	)
}
