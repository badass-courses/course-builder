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
			id={id}
			aria-label="Newsletter sign-up"
			className={cn(
				'bg-muted ring-border not-prose flex flex-col items-center justify-center rounded-xl p-5 ring-1 sm:p-10',
				className,
			)}
		>
			{children ? (
				children
			) : (
				<div className="mb-5 flex w-full flex-col gap-2 text-center">
					<h2 className="text-xl font-semibold sm:text-2xl lg:text-3xl">
						{title}
					</h2>
					<h3 className="mt-1 text-balance text-base font-normal opacity-80 sm:text-lg">
						{byline}
					</h3>
				</div>
			)}

			<div className="not-prose relative flex w-full items-center justify-center">
				{subscriber && (
					<div className="absolute z-10 flex -translate-y-8 flex-col text-center">
						<div className="text-lg font-semibold sm:text-xl lg:text-2xl">
							You're subscribed, thanks!
						</div>
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
				<div className="bg-muted ring-border mt-5 w-full rounded-xl p-1 ring-1">
					<div
						className={cn(
							'bg-card ring-border flex w-full flex-col gap-2 rounded-lg px-5 py-5 shadow-sm ring-1',
							{
								'blur-xs pointer-events-none select-none opacity-75 transition ease-in-out':
									subscriber,
							},
						)}
					>
						<SubscribeToConvertkitForm
							onSuccess={onSuccess ? onSuccess : handleOnSuccess}
							actionLabel={actionLabel}
							className="flex w-full max-w-sm flex-col items-start gap-3 text-left lg:max-w-full lg:flex-row lg:items-end"
						/>
						<p
							data-nospam=""
							className="text-muted-foreground inline-flex items-center text-xs sm:text-xs"
						>
							<ShieldCheckIcon className="mr-2 h-4 w-4" /> I respect your
							privacy. Unsubscribe at any time.
						</p>
					</div>
				</div>
			</div>
		</section>
	)
}
