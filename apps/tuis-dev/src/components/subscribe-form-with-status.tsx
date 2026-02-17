'use client'

import React from 'react'
import Link from 'next/link'
import {
	SubscribeForm,
	type SubscribeFormProps,
} from '@/components/subscribe-form'
import { api } from '@/trpc/react'
import { cn } from '@/utils/cn'
import { CheckCircle } from 'lucide-react'

type SubscribeFormWithStatusProps = SubscribeFormProps & {
	/** Message to show when already subscribed */
	subscribedMessage?: string
	/** Whether to show login link when subscribed */
	showLoginLink?: boolean
}

/**
 * Subscribe form that shows a subscribed state when the user has already subscribed.
 * Uses the subscriber cookie to determine subscription status.
 */
export function SubscribeFormWithStatus({
	subscribedMessage = "You're subscribed!",
	showLoginLink = false,
	className,
	...props
}: SubscribeFormWithStatusProps) {
	const { data: subscriber, status } =
		api.ability.getCurrentSubscriberFromCookie.useQuery()

	// Loading state - render nothing to avoid layout shift
	if (status === 'pending') {
		return <div className={cn('min-h-[80px]', className)} />
	}

	// Subscribed state
	if (subscriber) {
		return (
			<div className={cn('flex items-center gap-3 text-sm', className)}>
				<CheckCircle className="text-primary h-5 w-5" />
				<span className="text-muted-foreground">{subscribedMessage}</span>
				{showLoginLink && (
					<Link
						href="/login"
						className="text-primary hover:text-primary/80 font-medium underline-offset-4 hover:underline"
					>
						Log in
					</Link>
				)}
			</div>
		)
	}

	// Not subscribed - show form
	return <SubscribeForm className={className} {...props} />
}

export default SubscribeFormWithStatus
