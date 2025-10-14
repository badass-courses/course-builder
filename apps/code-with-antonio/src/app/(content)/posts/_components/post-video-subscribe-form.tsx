'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { redirectUrlBuilder, SubscribeToConvertkitForm } from '@/convertkit'
import { Subscriber } from '@/schemas/subscriber'
import common from '@/text/common'
import { api } from '@/trpc/react'
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
			<div className="max-w-(--breakpoint-xl) relative mx-auto flex w-full flex-col items-center justify-between gap-5 lg:container md:h-20 md:flex-row md:pl-3 md:pr-0 lg:pr-0">
				<div
					className="via-muted-foreground/20 bg-linear-to-r absolute -top-px left-0 z-10 h-px w-1/2 from-transparent to-transparent"
					aria-hidden="true"
				/>
				<div
					className="via-muted-foreground/20 bg-linear-to-r absolute -bottom-px left-0 z-10 h-px w-full from-transparent to-transparent"
					aria-hidden="true"
				/>
				<div className="flex flex-col items-center justify-center pt-4 text-center sm:text-left md:flex-col md:items-start md:pt-0">
					<div className="flex items-center">
						<div className="font-heading shrink-0 text-xl font-semibold sm:text-lg">
							{common['video-newsletter-title']}
						</div>
					</div>
					<div className="dark:text-primary font-heading text-balance text-sm text-gray-600">
						{common['video-newsletter-subtitle']}
					</div>
				</div>
				<div id={id} className="w-full md:w-auto">
					<SubscribeToConvertkitForm
						onSuccess={onSuccess ? onSuccess : handleOnSuccess}
						actionLabel={actionLabel}
						className="[&_input]:border-0 [&_input]:text-base"
					/>
				</div>
			</div>
		</section>
	)
}
