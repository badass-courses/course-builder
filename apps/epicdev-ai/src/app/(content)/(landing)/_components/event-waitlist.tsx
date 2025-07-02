'use client'

import { SubscribeToConvertkitForm } from '@/convertkit'
import { track } from '@/utils/analytics'
import { toSnakeCase } from 'drizzle-orm/casing'
import { CheckCircle } from 'lucide-react'

import { cn } from '@coursebuilder/ui/utils/cn'

export default function EventWaitlist({
	title,
	className,
	actionLabel = 'Join Waitlist',
}: {
	title: string
	className?: string
	actionLabel?: string
}) {
	const waitlistCkFields = {
		// example: waitlist_mcp_workshop_ticket: "2025-04-17"
		[`waitlist_${toSnakeCase(title)}`]: new Date().toISOString().slice(0, 10),
	}

	return (
		<SubscribeToConvertkitForm
			fields={waitlistCkFields}
			actionLabel={actionLabel}
			className={cn(
				'[&_button]:from-primary relative z-10 flex w-full flex-col items-center justify-center gap-2 [&_button]:mt-1 [&_button]:h-12 [&_button]:w-full [&_button]:bg-gradient-to-b [&_button]:to-indigo-800 [&_button]:text-base [&_button]:font-semibold [&_button]:text-white [&_input]:h-12 [&_input]:text-lg',
				className,
			)}
			successMessage={
				<p className="inline-flex items-center text-center text-lg font-medium">
					<CheckCircle className="text-primary mr-2 size-5" /> You are on the
					waitlist
				</p>
			}
			onSuccess={(subscriber, email) => {
				const handleOnSuccess = (subscriber: any) => {
					if (subscriber) {
						track('waitlist_joined', {
							product_name: title,
							email: email,
						})

						return subscriber
					}
				}
				handleOnSuccess(subscriber)
			}}
		/>
	)
}
