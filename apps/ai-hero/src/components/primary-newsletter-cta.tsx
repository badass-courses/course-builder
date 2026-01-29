'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShinyText } from '@/app/admin/pages/_components/page-builder-mdx-components'
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
	id = 'primary-newsletter-cta',
	title = common['primary-newsletter-tittle'],
	byline = common['primary-newsletter-byline'],
	actionLabel = common['primary-newsletter-button-cta-label'],
	trackProps = { event: 'subscribed', params: {} },
	isHiddenForSubscribers = false,
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
			// data-theme="elysium"
			id={id}
			aria-label="Newsletter sign-up"
			className={cn(
				'flex flex-col items-center justify-center px-5',
				className,
			)}
		>
			{children ? (
				children
			) : (
				<div className="relative z-10 flex max-w-3xl flex-col items-center justify-center px-5 pb-5 pt-10 sm:pb-10">
					<CldImage
						loading="lazy"
						src="https://res.cloudinary.com/total-typescript/image/upload/v1741008166/aihero.dev/assets/textured-logo-mark_2x_ecauns.png"
						alt=""
						aria-hidden="true"
						width={130}
						height={130}
						className="mb-8 rotate-12"
					/>
					<h2 className="font-heading text-center text-2xl font-semibold tracking-tight sm:text-3xl dark:text-white">
						{title}
					</h2>
					<h3 className="dark:text-primary pt-3 text-center font-sans text-base font-normal tracking-tight sm:pt-5 sm:text-lg lg:text-xl dark:sm:font-light">
						{byline}
					</h3>
				</div>
			)}

			<div className="not-prose relative flex w-full items-center justify-center">
				{subscriber && (
					<div className="absolute z-10 flex -translate-y-8 flex-col text-center">
						<ShinyText className="text-lg font-semibold sm:text-xl lg:text-2xl">
							You're subscribed, thanks!
						</ShinyText>
						<p className="pt-3 text-center font-sans text-lg font-normal opacity-90 sm:text-xl sm:font-light lg:text-2xl">
							{session?.user
								? common['newsletter-subscribed-logged-in']({
										resource,
									})
								: common['newsletter-subscribed-logged-out']({
										resource,
									})}
						</p>
					</div>
				)}
				<div
					className={cn('', {
						'blur-xs pointer-events-none select-none opacity-75 transition ease-in-out':
							subscriber,
					})}
				>
					<SubscribeToConvertkitForm
						onSuccess={onSuccess ? onSuccess : handleOnSuccess}
						actionLabel={actionLabel}
						className="[&_input]:border-foreground/40 relative z-10 [&_button]:mt-3 [&_button]:h-16 [&_button]:sm:text-lg [&_input]:h-16"
					/>
					<p
						data-nospam=""
						className="text-muted-foreground inline-flex items-center pt-8 text-xs opacity-75 sm:text-sm"
					>
						<ShieldCheckIcon className="mr-2 h-4 w-4" /> I respect your privacy.
						Unsubscribe at any time.
					</p>
				</div>
			</div>
		</section>
	)
}
