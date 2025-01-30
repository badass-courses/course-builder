'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { redirectUrlBuilder, SubscribeToConvertkitForm } from '@/convertkit'
import { Subscriber } from '@/schemas/subscriber'
import common from '@/text/common'
import { api } from '@/trpc/react'
import { track } from '@/utils/analytics'
import { cn } from '@/utils/cn'
import cookieUtil from '@/utils/cookies'
import { CK_SUBSCRIBER_KEY } from '@skillrecordings/config'
import { getCookie } from 'cookies-next/client'
import cookies from 'js-cookie'
import { useSession } from 'next-auth/react'
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
	const { data: subscriber, status } =
		api.ability.getCurrentSubscriberFromCookie.useQuery()

	const handleOnSuccess = (subscriber: Subscriber | undefined) => {
		if (subscriber) {
			track(trackProps.event as string, trackProps.params)
			const redirectUrl = redirectUrlBuilder(subscriber, '/confirm')
			router.push(redirectUrl)
		}
	}

	const [mounted, setMounted] = React.useState(false)

	React.useEffect(() => {
		setMounted(true)
	}, [])

	if (!mounted) {
		return null
	}

	if (status === 'pending') {
		return null
	}

	if (subscriber) {
		return null
	}

	return (
		<section
			aria-label="Newsletter sign-up"
			className={cn(
				'bg-muted relative flex w-full flex-row items-center border-t',
				className,
			)}
		>
			<div className="relative mx-auto flex w-full max-w-screen-xl flex-col items-center justify-between gap-5 md:container md:h-20 md:flex-row md:pr-0">
				<div
					className="via-muted-foreground/20 absolute -top-px left-0 z-10 h-px w-1/2 bg-gradient-to-r from-transparent to-transparent"
					aria-hidden="true"
				/>
				<div
					className="via-muted-foreground/20 absolute -bottom-px left-0 z-10 h-px w-full bg-gradient-to-r from-transparent to-transparent"
					aria-hidden="true"
				/>
				<div className="flex flex-col items-center justify-center gap-2 pt-5 text-center sm:gap-5 sm:pr-5 sm:text-left md:flex-col md:items-start md:gap-1 md:pt-0">
					<div className="flex items-center gap-2">
						<div className="xl:fluid-xl fluid-xl font-heading font-semibold">
							{common['video-newsletter-title']}
						</div>
					</div>
					<div className="dark:text-primary xl:fluid-lg fluid-base font-heading text-gray-600">
						{common['video-newsletter-subtitle']}
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
