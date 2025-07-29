'use client'

import * as React from 'react'
import { useCallback, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SubscribeToConvertkitForm } from '@/convertkit'
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
			if (typeof window !== 'undefined' && (window as any).createFloatingBear) {
				;(window as any).createFloatingBear(subscriber)
			}
			// No redirect - let the form handle inline success response
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
					className="[&_input]:border-foreground/40 relative z-10 w-full [&_input]:flex-1"
					onEmailFocus={handleEmailFocus}
					onEmailBlur={handleEmailBlur}
					showMascot={showMascot}
				/>
			</div>
		</section>
	)
}
