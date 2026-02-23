'use client'

import { StarIcon } from 'lucide-react'

/**
 * Displays attendee instructions for users who have purchased a ticket.
 * Only renders when instructions exist and user has purchased.
 */
export function AttendeeInstructions({
	attendeeInstructions,
}: {
	attendeeInstructions: any
}) {
	return (
		<div className="bg-card rounded-xl border p-5 sm:p-8">
			<p className="not-prose inline-flex items-center text-xl font-semibold">
				<StarIcon className="dark:text-primary mr-1 size-5 text-blue-600" /> For
				attendees
			</p>
			<article className="prose dark:prose-invert mt-2 max-w-none">
				{attendeeInstructions}
			</article>
		</div>
	)
}
