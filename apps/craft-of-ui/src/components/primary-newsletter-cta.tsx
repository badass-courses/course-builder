'use client'

import * as React from 'react'
import { useCallback, useState } from 'react'
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

	const [emailFocused, setEmailFocused] = useState(false)

	const handleEmailFocus = useCallback(() => {
		setEmailFocused(true)
	}, [])

	const handleEmailBlur = useCallback(() => {
		setEmailFocused(false)
	}, [])

	const showMascot = emailFocused

	if (isHiddenForSubscribers && subscriber) {
		return null
	}

	return (
		<section
			id={id}
			aria-label="Newsletter sign-up"
			className={cn('', className)}
		>
			{children ? (
				children
			) : (
				<div
					className={cn(
						'relative z-10 flex max-w-3xl flex-col items-center justify-center pb-5 pt-10 sm:pb-10',
						{
							'opacity-85 blur-sm': subscriber && shouldHideTitleWhenSubscribed,
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
					<h2 className="sm:fluid-2xl fluid-xl text-balance text-center font-bold">
						{title}
					</h2>
					<h3 className="text-balance pt-5 text-center font-sans text-base font-normal opacity-90 sm:text-lg lg:text-xl">
						{byline}
					</h3>
				</div>
			)}

			<div className="relative flex w-full items-center justify-center py-5">
				{subscriber && (
					<div className="absolute z-10 flex flex-col text-center">
						<p className="font-semibold">
							{subscribedTitle || "You're subscribed, thanks!"}
						</p>
						{resource && (
							<p className="[&_a]:text-primary text-center font-sans font-normal">
								{subscribedSubtitle ||
									(session?.user
										? common['newsletter-subscribed-logged-in']({
												resource,
											})
										: common['newsletter-subscribed-logged-out']({
												resource,
											}))}
							</p>
						)}
					</div>
				)}
				<div
					className={cn('flex w-full flex-col items-center', {
						'pointer-events-none select-none opacity-75 blur-sm transition ease-in-out':
							subscriber && !formId,
					})}
				>
					<SubscribeToConvertkitForm
						onSuccess={onSuccess ? onSuccess : handleOnSuccess}
						actionLabel={actionLabel}
						formId={formId}
						className="[&_input]:border-foreground/40 relative z-10 [&_input]:h-16"
						onEmailFocus={handleEmailFocus}
						onEmailBlur={handleEmailBlur}
						showMascot={showMascot}
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
