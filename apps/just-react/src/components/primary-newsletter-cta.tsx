'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { SubscribeForm } from '@/components/subscribe-form'
import { type SubscribeResult } from '@/lib/subscribe-actions'
import { api } from '@/trpc/react'
import { track } from '@/utils/analytics'
import { cn } from '@/utils/cn'
import { ShieldCheckIcon } from 'lucide-react'
import { useSession } from 'next-auth/react'

import common from '../text/common'

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

	const handleOnSuccess = (
		result: SubscribeResult & { success: true },
		email?: string,
	) => {
		track(trackProps.event as string, trackProps.params)
		router.push(`/confirmed?email=${encodeURIComponent(result.email)}`)
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
					<div className="absolute z-10 flex flex-col text-center">
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

				<div
					className={cn('flex w-full flex-col items-center', {
						'blur-xs pointer-events-none select-none opacity-75 transition ease-in-out':
							subscriber,
					})}
				>
					<SubscribeForm
						onSuccess={onSuccess ? onSuccess : handleOnSuccess}
						actionLabel={actionLabel}
						redirectTo={null}
					/>
					<p
						data-nospam=""
						className="text-muted-foreground inline-flex items-center py-5 text-sm"
					>
						<ShieldCheckIcon className="mr-2 h-4 w-4" /> I respect your privacy.
						Unsubscribe at any time.
					</p>
				</div>
			</div>
		</section>
	)
}
