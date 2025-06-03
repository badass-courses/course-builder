'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { redirectUrlBuilder, SubscribeToConvertkitForm } from '@/convertkit'
import { Subscriber } from '@/schemas/subscriber'
import common from '@/text/common'
import { api } from '@/trpc/react'
import { track } from '@/utils/analytics'
import { cn } from '@/utils/cn'
import { Mail } from 'lucide-react'

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
				'dark:bg-card relative mt-2 flex w-full flex-row items-center overflow-hidden rounded-md border bg-gray-50',
				className,
			)}
		>
			<div className="relative mx-auto flex w-full max-w-screen-xl flex-col items-center justify-between gap-5 lg:container lg:h-16 lg:flex-row lg:pl-3 lg:pr-0">
				<div className="flex flex-col items-center justify-center pt-4 text-center sm:text-left lg:flex-col lg:items-start lg:pt-0">
					<div className="flex items-center gap-2">
						<Mail className="text-primary size-4" />
						<div className="font-heading flex-shrink-0 text-xl font-semibold lg:text-base">
							{common['video-newsletter-title']}
						</div>
					</div>
					<div className="dark:text-primary lg:fluid-sm fluid-base font-heading text-gray-600 lg:pl-6">
						{common['video-newsletter-subtitle']}
					</div>
				</div>
				<div id={id} className="w-full border-t lg:w-auto lg:border-t-0">
					<SubscribeToConvertkitForm
						onSuccess={onSuccess ? onSuccess : handleOnSuccess}
						actionLabel={actionLabel}
						className="dark:[&_input]:bg-card [&_button]:from-primary dark:hover:[&_input]:bg-background [&_button]:bg-gradient-to-b [&_button]:to-indigo-800 [&_input]:border-0 [&_input]:bg-gray-50 [&_input]:text-base hover:[&_input]:bg-gray-100"
					/>
				</div>
			</div>
		</section>
	)
}
